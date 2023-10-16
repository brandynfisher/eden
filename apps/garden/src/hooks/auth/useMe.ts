import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMe = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { data, mutate } = useSWR(isAuthenticated ? `/api/me` : null, fetcher)

  return {
    user: isAuthenticated ? data?.creator : undefined,
    balance: isAuthenticated ? data?.balance : undefined,
    pendingTasks: isAuthenticated ? data?.pendingTasks : undefined,
    refetchMe: mutate,
  }
}
