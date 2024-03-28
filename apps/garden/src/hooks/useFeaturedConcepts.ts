import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useFeaturedConcepts = () => {
  const { data, mutate, isLoading, error } = useSWR(
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
