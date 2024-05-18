import { OrderByLatest } from '@/components/Layout/buttons/OrderByButtons'
import { createPaginationRoute, fetcher } from '@/lib/fetcher'
// import { truncatedAddress } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Task, TaskUpdateEvent } from '@edenlabs/eden-sdk'
import { useLocalStorage } from '@mantine/hooks'
// import { App } from 'antd'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useAuth } from '@clerk/nextjs'
import { useClerkUserState } from '@/hooks/auth/useClerkUserState'
import useSWR from 'swr/immutable'

export const useCreationState = () => {
  // const { message } = App.useApp()
  const { getToken } = useAuth()
  const { isAuthenticated } = useClerkUserState()
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<Task[]>()
  const { userId } = useContext(UserContext)
  const { data: tasksData } = useSWR(
    `/api/tasks/list?status=running,starting,pending,completed,failed`,
    fetcher,
  )

  const [ tasks, setTasks ] = useState<Task[]>([])

  useEffect(() => {
    if (tasksData && tasksData.tasks !== undefined) {
      // console.log('setting tasks initially', {tasks})

      setTasks(tasksData.tasks)
    }
  }, [tasksData])

  const [dismissedTaskIds, setDismissedTaskIds] = useLocalStorage<string[]>({
    key: 'tasks::dismissed',
    defaultValue: [],
  })

  const addDismissedTaskIds = (taskIds: string[]) => {
    setDismissedTaskIds(prev => [
      ...prev.slice(-100),
      ...taskIds.filter(taskId => !prev.includes(taskId)),
    ])
  }

  const [ currentAuthToken, setCurrentAuthToken ] = useState<string|null>()

  const refreshToken = useCallback(async () => {
    const newToken = await getToken()
    if (newToken) {
      setCurrentAuthToken(prev => newToken && newToken !== prev ? newToken : prev)
    }
  }, [getToken, setCurrentAuthToken])

  useEffect(() => {
    refreshToken()
  }, [activeTaskId])

  useEffect(() => {
    let eventSource: EventSourcePolyfill|undefined

    if (isAuthenticated && userId) {
      const initEventSource = async () => {
        // console.log('setting up eventsource', `${process.env.NEXT_PUBLIC_EDEN_SSE_URL}/tasks/events`)
        eventSource = new EventSourcePolyfill(
          `${process.env.NEXT_PUBLIC_EDEN_SSE_URL}/tasks/events`,
          {
            headers: {
              Authorization: `Bearer ${currentAuthToken || await getToken()}`,
            },
          }
        )

        // eventSource.addEventListener('init-ping', (event) => {
        //   console.log(event)
        // }, false)

        eventSource.addEventListener('keep-alive', () => {
          // console.log(event)
          refreshToken()
        }, false)

        eventSource.addEventListener('task-update', (event) => {
          const { data: update } = event as MessageEvent
          const data: TaskUpdateEvent = JSON.parse(update)
          // console.log('UI::task-update', type, lastEventId, data)

          if (data) {
            setTasks(prevState => {
              const newState = [...prevState]
              const existingTaskIndex = newState.findIndex(item => item.taskId === data.taskId)

              if (existingTaskIndex !== -1) {
                newState[existingTaskIndex] = {
                  ...newState[existingTaskIndex],
                  ...data.task
                }

                return newState
              }

              if (data.task) {
                return [ data.task, ...newState ]
              }

              return newState
            })
          }
        }, false)
        eventSource.onerror = error => {
          // console.error(error)
          console.error('UI eventsource.onerror', error)
        }
      }
      initEventSource()
    }

    return () => {
      eventSource && eventSource.close()
      eventSource = undefined
    }
  }, [currentAuthToken, isAuthenticated, userId])

  const { mutate: mutateGlobal } = useSWRConfig()
  const [notificationCutOffDate, setNotificationCutOffDate] =
    useState<number>(0)

  const notify = useCallback(
    async (items: Task[]) => {

      if (items && items.length) {
        items.map(item => {
          // only show notifications for tasks that finished after the page was loaded
          const isExpired =
            new Date(item.updatedAt).getTime() - notificationCutOffDate < 0

          if (isExpired) {
            return
          }

          if (item.status === 'completed') {
            // message.success(
            //   `Task ${truncatedAddress(item.taskId)} completed successfully!`,
            // )
          }

          if (item.status === 'failed') {
            // message.error(
            //   `An error occured for Task ${truncatedAddress(item.taskId)}.`,
            // )
          }
        })
      }
      setNotificationCutOffDate(Date.now())
    },
    [notificationCutOffDate],
  )

  useEffect(() => {
    if (dismissedTaskIds && dismissedTaskIds.length) {
      setCompletedTasks(prev =>
        prev.filter(item => !dismissedTaskIds.includes(item._id)),
      )
      setFailedTasks(prev =>
        prev.filter(item => !dismissedTaskIds.includes(item._id)),
      )
    }
  }, [dismissedTaskIds])

  useEffect(() => {
    setNotificationCutOffDate(Date.now())
  }, [])

  useEffect(() => {
    if (tasks && tasks.length) {
      setPendingTasks(
        tasks?.filter(
          task =>
            task.status === 'pending' ||
            task.status === 'processing' ||
            task.status === 'running' ||
            task.status === 'starting',
        ),
      )

      const completed = tasks?.filter(task => task.status === 'completed')
      setCompletedTasks(prevState => {
        if (completed.length !== prevState.length) {
          // probably got a new finished task, trigger mutate on own profile (first page) to force a refresh
          const ownCreatorFeedPageRoute = createPaginationRoute(
            `/api/feed/creations`,
            {
              userId: userId || '',
              limit: 25,
              page: 1,
              orderBy: OrderByLatest.field,
            },
          )
          mutateGlobal(ownCreatorFeedPageRoute, undefined)
          // brutally refreshes
          mutateGlobal(
            key =>
              typeof key === 'string' && key.startsWith('/api/feed/concepts'),
            undefined,
          )
          notify(
            completed.filter(
              item =>
                !dismissedTaskIds.includes(item._id) &&
                prevState.filter(prevItem => prevItem._id !== item._id).length,
            ),
          )
        }

        return completed.filter(item => !dismissedTaskIds.includes(item._id))
      })

      const failed = tasks?.filter(
        task =>
          task.status === 'failed' && !dismissedTaskIds.includes(task._id),
      )
      setFailedTasks(failed)
    }
  }, [dismissedTaskIds, mutateGlobal, tasks, userId])

  return {
    tasks,
    pendingTasks,
    completedTasks,
    setCompletedTasks,
    failedTasks,
    setFailedTasks,
    dismissedTaskIds,
    addDismissedTaskIds,
    activeTaskId,
    setActiveTaskId,
    hasChangedGenerator,
    setHasChangedGenerator,
  }
}
