import { fetcher } from '@/lib/fetcher'
import { truncatedAddress } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Task } from '@edenlabs/eden-sdk'
import { App } from 'antd'
import { useContext, useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const { message } = App.useApp()
  const [taskIds, setTaskIds] = useState<string[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const { pendingTasks: userPendingTasks } = useContext(UserContext)

  const { data: pendingTaskData, mutate: refetchPending } = useSWR(
    `/api/tasks/list?status=running,starting,pending,completed`,
    fetcher,
    { keepPreviousData: true },
  )

  useEffect(() => {
    if (!taskIds.length && userPendingTasks && userPendingTasks.length) {
      setTaskIds(userPendingTasks.map(task => task.taskId))
    }
  }, [userPendingTasks])

  const tasks = pendingTaskData?.tasks as Task[]

  const pendingTasks = tasks?.filter(
    task =>
      task.status === 'pending' ||
      task.status === 'processing' ||
      task.status === 'running' ||
      task.status === 'starting',
  )

  useEffect(() => {
    const intervalId = setInterval(refetchPending, 5000) // Refetch every 5 seconds

    // Cleanup function to remove completed tasks from taskIds
    const cleanupTasks = async () => {
      if (tasks) {
        const completedTaskIds = tasks
          .filter(task => task.status === 'completed')
          .map(task => task.taskId)

        const failedTaskIds = tasks
          .filter(task => task.status === 'failed')
          .map(task => task.taskId)

        if (completedTaskIds.length > 0) {
          // send a success toast
          completedTaskIds.forEach(taskId => {
            const task = tasks.find(task => task.taskId === taskId)
            if (task) {
              message.destroy()
              message.success(
                `Task ${truncatedAddress(task.taskId)} completed successfully!`,
              )
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

        if (failedTaskIds.length > 0) {
          // send a failure toast
          failedTaskIds.forEach(taskId => {
            const task = tasks.find(task => task.taskId === taskId)
            if (task) {
              message.destroy()
              message.error(
                `An error occured for Task ${truncatedAddress(task.taskId)}.`,
              )
            }
          })
          setTaskIds(prevTaskIds =>
            prevTaskIds.filter(id => !failedTaskIds.includes(id)),
          )
          setFailedTasks(prevFailedTasks =>
            prevFailedTasks.concat(
              tasks.filter(task => task.status === 'failed'),
            ),
          )
        }
      }
    }

    cleanupTasks()

    return () => {
      clearInterval(intervalId)
    }
  }, [tasks, pendingTaskData])

  return {
    taskIds,
    setTaskIds,
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
    // refetchPendingTasks,
  }
}
