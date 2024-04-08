import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useFeaturedConcepts = () => {
  const { data, mutate, isLoading, error } = useSWRImmutable(
    `/api/feed/concepts?page=1&limit=10&orderBy=creationCount&direction=-1`,
    fetcher,
  )

  return {
    concepts: data?.docs as Concept[] | null,
    mutate,
    isLoading,
    error,
  }
}
