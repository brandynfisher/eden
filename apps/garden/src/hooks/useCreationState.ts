import { fetcher } from '@/lib/fetcher'
import { Task } from '@eden-labs/eden-sdk/dist/responses/TasksGetResponse'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const [taskIds, setTaskIds] = useState<string[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string>()
  const [hasChangedGenerator, setHasChangedGenerator] = useState(false)
  const { data, mutate: refetchPendingTasks } = useSWR(
    taskIds.length > 0
      ? `/api/tasks/pending?taskIds=${taskIds.join(',')}`
      : null,
    fetcher,
  )

  const tasks = data?.tasks as Task[]
  const pendingTasks = tasks?.filter(task => task.status === 'pending')

  useEffect(() => {
    const intervalId = setInterval(refetchPendingTasks, 5000) // Refetch every 5 seconds
    return () => clearInterval(intervalId)
  }, [refetchPendingTasks])

  return {
    taskIds,
    setTaskIds,
    tasks,
    pendingTasks,
    activeTaskId,
    setActiveTaskId,
    hasChangedGenerator,
    setHasChangedGenerator,
    refetchPendingTasks,
  }
}
