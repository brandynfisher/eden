import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMyCharacters = (
  userId: string | null,
  isAuthenticated: boolean,
  options = {},
) => {
  const { data, mutate: refetchMyCharacters } = useSWR(
    userId && isAuthenticated ? `/api/characters/user?userId=${userId}` : null,
    fetcher,
    options,
  )

  return {
    characters: isAuthenticated ? data?.characters : undefined,
    refetchMyCharacters,
  }
}
