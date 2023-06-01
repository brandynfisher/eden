import { fetcher } from '@/lib/fetcher'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useCreationState = () => {
  const [taskIds, setTaskIds] = useState<string[]>([])
  const { data, mutate: refetchPendingTasks } = useSWR(
    `/api/tasks/pending?taskIds=${taskIds.join(',')}`,
    fetcher,
  )

  useEffect(() => {
    const intervalId = setInterval(refetchPendingTasks, 5000) // Refetch every 5 seconds
    return () => clearInterval(intervalId)
  }, [refetchPendingTasks])

  return {
    taskIds,
    setTaskIds,
    tasks: data?.tasks,
    refetchPendingTasks,
  }
}
