import { fetcher } from '@/lib/fetcher'
import { Task } from '@eden-labs/eden-sdk'
import { App } from 'antd'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const { message } = App.useApp()
  const [taskIds, setTaskIds] = useState<string[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const { data, mutate: refetchPendingTasks } = useSWR(
    taskIds.length > 0
      ? `/api/tasks/pending?taskIds=${taskIds.join(',')}`
      : null,
    fetcher,
  )

  const tasks = data?.tasks as Task[]
  const pendingTasks = tasks?.filter(
    task =>
      task.status === 'pending' ||
      task.status === 'processing' ||
      task.status === 'running',
  )

  useEffect(() => {
    const intervalId = setInterval(refetchPendingTasks, 5000) // Refetch every 5 seconds

    // Cleanup function to remove completed tasks from taskIds
    const cleanupTasks = () => {
      if (tasks) {
        const completedTaskIds = tasks
          .filter(task => task.status === 'completed')
          .map(task => task.taskId)

        if (completedTaskIds.length > 0) {
          // send a success toast
          completedTaskIds.forEach(taskId => {
            const task = tasks.find(task => task.taskId === taskId)
            if (task) {
              message.destroy()
              message.success(`Task ${task.taskId} completed successfully!`)
            }
          })
          setTaskIds(prevTaskIds =>
            prevTaskIds.filter(id => !completedTaskIds.includes(id)),
          )
          setCompletedTasks(prevCompletedTasks =>
            prevCompletedTasks.concat(
              tasks.filter(task => task.status === 'completed'),
            ),
          )
        }
      }
    }

    cleanupTasks()

    return () => {
      clearInterval(intervalId)
    }
  }, [tasks, refetchPendingTasks])

  return {
    taskIds,
    setTaskIds,
    tasks,
    pendingTasks,
    completedTasks,
    setCompletedTasks,
    activeTaskId,
    setActiveTaskId,
    hasChangedGenerator,
    setHasChangedGenerator,
    refetchPendingTasks,
  }
}
