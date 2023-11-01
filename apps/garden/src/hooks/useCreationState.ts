import { fetcher } from '@/lib/fetcher'
import { truncatedAddress } from '@/lib/string'
import { Task } from '@edenlabs/eden-sdk'
import { App } from 'antd'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const { message } = App.useApp()
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
