import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMySessionEvents = ({
  sessionId,
  isAuthenticated,
  options,
}: {
  sessionId: string | null
  isAuthenticated: boolean
  options?: {}
}) => {
  const { data, mutate: refetchMyCharacters } = useSWR(
    sessionId && isAuthenticated ? `/api/sessions/${sessionId}/events` : null,
    fetcher,
    options,
  )

  return {
    sessions: isAuthenticated ? data?.sessions : undefined,
    refetchMyCharacters,
  }
}
