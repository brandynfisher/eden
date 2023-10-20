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

  useEffect(() => {
    const intervalId = setInterval(refetchTasks, 5000) // Refetch every 5 seconds

    // Cleanup function to remove completed tasks from taskIds
    const cleanupTasks = async () => {
      if (tasks && tasks.length) {
        if (tasks[tasks.length - 1].status === 'completed') {
          message.destroy()
          message.success(
            `Task ${truncatedAddress(
              tasks[tasks.length - 1].taskId,
            )} completed successfully!`,
          )
        }

        if (tasks[tasks.length - 1].status === 'failed') {
          message.destroy()
          message.error(
            `An error occured for Task ${truncatedAddress(
              tasks[tasks.length - 1].taskId,
            )}.`,
          )
        }
      }
    }

    cleanupTasks()

    return () => {
      clearInterval(intervalId)
    }
  }, [tasks])

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
