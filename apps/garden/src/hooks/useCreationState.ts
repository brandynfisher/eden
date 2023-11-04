import { CONFIG } from '@/lib/config'
import { fetcher } from '@/lib/fetcher'
import { truncatedAddress } from '@/lib/string'
import { useAuth } from '@clerk/nextjs'
import { Task } from '@edenlabs/eden-sdk'
import { App } from 'antd'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

interface TaskUpdateEvent {
  userId: string
  taskId: string
  status: string
  progress?: number
  result?: string
}

export const useCreationState = () => {
  const { message } = App.useApp()
  const { userId, getToken } = useAuth()
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const { data: tasksData, mutate: refetchTasks } = useSWR(
    `/api/tasks/list`,
    fetcher,
    { keepPreviousData: true },
  )
  const tasks = tasksData?.tasks as Task[]

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
      setCompletedTasks(tasks?.filter(task => task.status === 'completed'))

      setFailedTasks(tasks?.filter(task => task.status === 'failed'))
    }
  }, [tasks])

  // Set up event listener
  useEffect(() => {
    const handleTaskUpdate = (event: TaskUpdateEvent) => {
      const taskId = event.taskId
      if (event.status === 'completed') {
        refetchTasks()
        message.destroy()
        message.success(
          `Task ${truncatedAddress(taskId)} completed successfully!`,
        )
      } else if (event.status === 'failed') {
        refetchTasks()
        message.destroy()
        message.error(`An error occured for Task ${truncatedAddress(taskId)}!`)
      }
    }

    const setupEventSource = async () => {
      if (userId) {
        const token = await getToken()

        const eventSource = new EventSourcePolyfill(
          `${CONFIG.NEXT_PUBLIC_EDEN_API_URL}/tasks/events`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data)
          handleTaskUpdate(data)
        }

        eventSource.onerror = error => {
          console.error(error)
        }

        return () => {
          eventSource.close()
        }
      }
    }

    setupEventSource()
  }, [userId, getToken])

  return {
    tasks,
    pendingTasks,
    setPendingTasks,
    completedTasks,
    setCompletedTasks,
    failedTasks,
    setFailedTasks,
    activeTaskId,
    setActiveTaskId,
    hasChangedGenerator,
    setHasChangedGenerator,
    refetchTasks,
  }
}
