import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMySessions = ({
  userId,
  isAuthenticated,
  options,
}: {
  userId: string | null
  isAuthenticated: boolean
  options?: {}
}) => {
  const { data, mutate: refetchMyCharacters } = useSWR(
    userId && isAuthenticated ? `/api/sessions/user?userId=${userId}` : null,
    fetcher,
    options,
  )

  return {
    sessions: isAuthenticated ? data?.sessions : undefined,
    refetchMyCharacters,
  }
}
