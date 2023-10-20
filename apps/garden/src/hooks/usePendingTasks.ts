import { fetcher } from '@/lib/fetcher'
import { Task } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const usePendingTasks = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) => {
  const { data, mutate } = useSWR(
    isAuthenticated
      ? `/api/tasks/list?status=pending,processing,running,starting`
      : null,
    fetcher,
    { keepPreviousData: true },
  )
  // filter to last day
  const pendingTasks = data?.tasks as Task[]
  const recentPendingTasks = pendingTasks?.filter(
    task => Date.now() - new Date(task.createdAt).getTime() < 86400000,
  )

  return {
    pendingTasks: isAuthenticated ? recentPendingTasks : undefined,
    refetchPendingTasks: mutate,
  }
}
