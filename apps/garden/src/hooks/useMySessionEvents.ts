import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMySessionEvents = ({
  userId,
  isAuthenticated,
  options,
}: {
  userId: string | null
  isAuthenticated: boolean
  options?: {}
}) => {
  const { data, mutate: refetchMyCharacters } = useSWR(
    userId && isAuthenticated ? `/api/sessions/?userId=${userId}` : null,
    fetcher,
    options,
  )

  return {
    sessions: isAuthenticated ? data?.sessions : undefined,
    refetchMyCharacters,
  }
}
