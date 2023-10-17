import { fetcher } from '@/lib/fetcher'
import { useAuth } from '@clerk/nextjs'
import useSWR from 'swr'

export const useMe = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { getToken } = useAuth()
  const route = '/api/me'

  const { data, mutate } = useSWR(isAuthenticated ? route : null, async () =>
    fetcher(route, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    }),
  )

  return {
    user: isAuthenticated ? data?.creator : undefined,
    balance: isAuthenticated ? data?.balance : undefined,
    pendingTasks: isAuthenticated ? data?.pendingTasks : undefined,
    refetchMe: mutate,
  }
}
