import { fetcher } from '@/lib/fetcher'
import { truncatedAddress } from '@/lib/string'
import { useAuth } from '@clerk/nextjs'
import { Task } from '@edenlabs/eden-sdk'
import { App } from 'antd'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const { message } = App.useApp()
  const { userId, getToken } = useAuth()
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<Task[]>()
  const { data: tasksData, mutate: refetchTasks } = useSWR(
    `/api/tasks/list?status=running,starting,pending,completed,failed`,
    fetcher,
    { refreshInterval: 5000 },
  )
  const [notificationCutOffDate, setNotificationCutOffDate] =
    useState<number>(0)
  const tasks = tasksData?.tasks as Task[]

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

      setCompletedTasks(tasks?.filter(task => task.status === 'completed'))

      setFailedTasks(tasks?.filter(task => task.status === 'failed'))
    }
  }, [tasks])

  useEffect(() => {
    const setupEventSource = async () => {
      if (userId) {
        const token = await getToken()

        const eventSource = new EventSourcePolyfill(
          'http://localhost:5050/tasks/events',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data)
          console.log(data)
        }

        eventSource.onerror = error => {
          console.error('EventSource failed:', error)
        }

        return () => {
          eventSource.close()
        }
      }
    }

    setupEventSource()
  }, [userId, getToken])

  useEffect(() => {
    // Cleanup function to remove completed tasks from taskIds
    const notify = async () => {
      if (tasks && tasks.length) {
        // only show notifications for tasks that finished after the page was loaded
        const isExpired =
          new Date(tasks[0].updatedAt).getTime() - notificationCutOffDate <
          10000

        if (isExpired) {
          return
        }

        if (tasks[0].status === 'completed') {
          message.destroy()
          message.success(
            `Task ${truncatedAddress(tasks[0].taskId)} completed successfully!`,
          )
        }

        if (tasks[0].status === 'failed') {
          message.destroy()
          message.error(
            `An error occured for Task ${truncatedAddress(tasks[0].taskId)}.`,
          )
        }
      }
    }

    notify()
  }, [tasks, completedTasks])

  return {
    tasks,
    pendingTasks,
    completedTasks,
    setCompletedTasks,
    failedTasks,
    setFailedTasks,
    activeTaskId,
    setActiveTaskId,
    hasChangedGenerator,
    setHasChangedGenerator,
    refetchTasks: refetchTasks,
  }
}
