import { fetcher } from '@/lib/fetcher'
import { Character } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCharacter = (characterId: string | string[] | undefined) => {
  const id = typeof characterId === 'string' ? characterId : undefined
  const { data, mutate } = useSWR(
    id ? `/api/characters?characterId=${id}` : null,
    fetcher,
  )

  return {
    character: data?.character as Character,
    mutate,
  }
}
