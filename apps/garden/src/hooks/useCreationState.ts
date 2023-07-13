import { truncatedAddress } from '@/lib/address'
import { fetcher } from '@/lib/fetcher'
import { Task } from '@eden-labs/eden-sdk'
import { App } from 'antd'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

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
  const { mutate, cache } = useSWRConfig()

  const mutateSWRCacheKeys = async (keyFilter: string) => {
    const isPrefixFilter = keyFilter.startsWith('/')

    // find all */api/feed/ cache keys and trigger mutation/revalidation/refetch
    for (const key of Array.from(cache.keys())) {
      // swr infinite keys have a different format and need to be matched with a broader 'includes' filter
      const targetKey = isPrefixFilter
        ? key.startsWith(keyFilter)
        : key.includes(keyFilter)
      if (targetKey) {
        await mutate(key, [])
      }
    }
  }

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
    const cleanupTasks = async () => {
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

          // trigger refetch of cached masonry requests
          await mutateSWRCacheKeys('api/feed')
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
