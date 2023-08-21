import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useConcepts = (options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    '/api/concepts',
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
