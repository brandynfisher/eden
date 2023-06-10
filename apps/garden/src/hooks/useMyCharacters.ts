import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMyCharacters = ({
  userId,
  isAuthenticated,
}: {
  userId: string
  isAuthenticated: boolean
}) => {
  const { data } = useSWR(
    isAuthenticated ? `/api/agents/user?userId=${userId}` : null,
    fetcher,
  )

  return {
    characters: isAuthenticated ? data?.characters : undefined,
  }
}
