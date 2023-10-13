import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const usePendingTasks = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) => {
  const { data, mutate } = useSWR(
    isAuthenticated
      ? `/api/tasks/list?status=pending,processing,running`
      : null,
    fetcher,
  )
  console.log(data)

  return {
    pendingTasks: isAuthenticated ? data?.tasks : undefined,
    refetchPendingTasks: mutate,
  }
}
