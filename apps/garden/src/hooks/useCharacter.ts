import { fetcher } from '@/lib/fetcher'
import { Character } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCharacter = (characterId: string | undefined) => {
  const id = typeof characterId === 'string' ? characterId : undefined
  const { data, mutate } = useSWR(id ? `/api/characters/${id}` : null, fetcher)

  return {
    character: data?.character as Character,
    mutate,
  }
}
