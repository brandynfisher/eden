import { fetcher } from '@/lib/fetcher'
import { Session } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useSession = (sessionId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    sessionId ? `/api/sessions/${sessionId}` : null,
    fetcher,
    options,
  )

  return {
    session: data?.session as Session | null,
    mutate,
    isLoading,
    error,
  }
}
