import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useCharacters = ({
  isAuthenticated,
  options,
}: {
  isAuthenticated: boolean
  options?: {}
}) => {
  const { data, mutate: refetchCharacters } = useSWR(
    isAuthenticated ? `/api/characters/all` : null,
    fetcher,
    options,
  )

  return {
    characters: isAuthenticated && data ? data?.characters : undefined,
    refetchCharacters,
  }
}
