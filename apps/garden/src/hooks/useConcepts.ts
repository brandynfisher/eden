import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useConcepts = (userId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    userId ? `/api/concepts?userId=${userId}` : `/api/concepts`,
    fetcher,
    options,
  )

  return {
    concepts: data?.concepts as Concept[] | null,
    mutate,
    isLoading,
    error,
  }
}
