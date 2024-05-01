// import { CONFIG } from '@/lib/config'
// import { fetcher } from '@/lib/fetcher'
// import { truncatedAddress } from '@/lib/string'
// import { useAuth } from '@clerk/nextjs'
// import { Task } from '@edenlabs/eden-sdk'
// import { App } from 'antd'
// import { EventSourcePolyfill } from 'event-source-polyfill'
// import { useEffect, useState } from 'react'
// import useSWR from 'swr'
// interface TaskUpdateEvent {
//   userId: string
//   taskId: string
//   status: string
//   progress?: number
//   result?: string
// }
// export const useCreationState = () => {
//   const { message } = App.useApp()
//   const { userId, getToken } = useAuth()
//   const [activeTaskId, setActiveTaskId] = useState<string>()
//   const [pendingTasks, setPendingTasks] = useState<Task[]>([])
//   const [completedTasks, setCompletedTasks] = useState<Task[]>([])
//   const [failedTasks, setFailedTasks] = useState<Task[]>([])
//   const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
//   const { data: tasksData, mutate: refetchTasks } = useSWR(
//     `/api/tasks/list`,
//     fetcher,
//     { keepPreviousData: true },
//   )
//   const tasks = tasksData?.tasks as Task[]
//   useEffect(() => {
//     if (tasks && tasks.length) {
//       setPendingTasks(
//         tasks?.filter(
//           task =>
//             task.status === 'pending' ||
//             task.status === 'processing' ||
//             task.status === 'running' ||
//             task.status === 'starting',
//         ),
//       )
//       setCompletedTasks(tasks?.filter(task => task.status === 'completed'))
//       setFailedTasks(tasks?.filter(task => task.status === 'failed'))
//     }
//   }, [tasks])
//   // Set up event listener
//   // useEffect(() => {
//   //   const handleTaskUpdate = (event: TaskUpdateEvent) => {
//   //     const taskId = event.taskId
//   //     if (event.status === 'completed') {
//   //       refetchTasks()
//   //       message.destroy()
//   //       message.success(
//   //         `Task ${truncatedAddress(taskId)} completed successfully!`,
//   //       )
//   //     } else if (event.status === 'failed') {
//   //       refetchTasks()
//   //       message.destroy()
//   //       message.error(`An error occured for Task ${truncatedAddress(taskId)}!`)
//   //     }
//   //   }
//   //   const setupEventSource = async () => {
//   //     if (userId) {
//   //       const token = await getToken()
//   //       const eventSource = new EventSourcePolyfill(
//   //         `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/tasks/events`,
//   //         {
//   //           headers: {
//   //             Authorization: `Bearer ${token}`,
//   //           },
//   //         },
//   //       )
//   //       eventSource.onmessage = event => {
//   //         const data = JSON.parse(event.data)
//   //         handleTaskUpdate(data)
//   //       }
//   //       eventSource.onerror = error => {
//   //         console.error(error)
//   //       }
//   //       return () => {
//   //         eventSource.close()
//   //       }
//   //     }
//   //   }
//   //   setupEventSource()
//   // }, [userId, getToken])
//   return {
//     tasks,
//     pendingTasks,
//     setPendingTasks,
//     completedTasks,
//     setCompletedTasks,
//     failedTasks,
//     setFailedTasks,
//     activeTaskId,
//     setActiveTaskId,
//     hasChangedGenerator,
//     setHasChangedGenerator,
//     refetchTasks,
//   }
// }
import { OrderByLatest } from '@/components/Layout/buttons/OrderByButtons'
import { createPaginationRoute, fetcher } from '@/lib/fetcher'
import { truncatedAddress } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Task, TaskUpdateEvent } from '@edenlabs/eden-sdk'
import { useLocalStorage } from '@mantine/hooks'
import { App } from 'antd'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { CONFIG } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import { useClerkUserState } from '@/hooks/auth/useClerkUserState'
import useSWRImmutable from 'swr/immutable'

export const useCreationState = () => {
  const { message } = App.useApp()
  const { getToken } = useAuth()
  const { isAuthenticated } = useClerkUserState()
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<Task[]>()
  const { userId } = useContext(UserContext)
  const { data: tasksData } = useSWRImmutable(
    `/api/tasks/list?status=running,starting,pending,completed,failed`,
    fetcher,
  )

  const [ tasks, setTasks ] = useState<Task[]>([])

  useEffect(() => {
    if (tasksData && tasksData.tasks !== undefined) {
      console.log('setting tasks initially', {tasks})

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

  useEffect(() => {
    let eventSource: EventSourcePolyfill|undefined

    if (isAuthenticated && userId) {
      const initEventSource = async () => {
        console.log('setting up eventsource', `/api/tasks/events`)
        eventSource = new EventSourcePolyfill(
          `${CONFIG.NEXT_PUBLIC_EDEN_SSE_URL}/tasks/events`,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        )
        eventSource.onmessage = event => {
          const data: TaskUpdateEvent = JSON.parse(event.data)
          console.log('UI eventsource.onmessage', event, data)

          if (data) {
            console.log('taskUpdateevent', data)
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
                newState.push(data.task)
              }

              return newState
            })
          }
        }
        eventSource.onerror = error => {
          // console.error(error)
          console.error('UI eventsource.onerror', error)
        }
      }
      initEventSource()
    }

    return () => {
      eventSource && eventSource.close()
    }
  }, [getToken, isAuthenticated, userId])

  const { mutate: mutateGlobal } = useSWRConfig()
  const [notificationCutOffDate, setNotificationCutOffDate] =
    useState<number>(0)

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
  }, [mutateGlobal, tasks, userId])

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
            message.destroy()
            message.success(
              `Task ${truncatedAddress(item.taskId)} completed successfully!`,
            )
          }

          if (item.status === 'failed') {
            message.destroy()
            message.error(
              `An error occured for Task ${truncatedAddress(item.taskId)}.`,
            )
          }
        })
      }
      setNotificationCutOffDate(Date.now())
    },
    [notificationCutOffDate],
  )

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
