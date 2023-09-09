import { fetcher } from '@/lib/fetcher'
import { Character } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCharacter = (characterSlug: string | string[] | undefined) => {
  const slug = typeof characterSlug === 'string' ? characterSlug : undefined
  const { data, mutate } = useSWR(
    slug ? `/api/characters?slug=${slug}` : null,
    fetcher,
  )

  return {
    character: data?.character as Character,
    mutate,
  }
}
