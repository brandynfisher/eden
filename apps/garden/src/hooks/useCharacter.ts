import { fetcher } from '@/lib/fetcher'
import { Character } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCharacter = (characterId: string | null, options = {}) => {
  const id = typeof characterId === 'string' ? characterId : undefined
  const { data, mutate, isLoading } = useSWR(
    id ? `/api/characters/${id}` : null,
    fetcher,
    options,
  )

  return {
    character: data?.character as Character,
    isLoading,
    mutate,
  }
}
