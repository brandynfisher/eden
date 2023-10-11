import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useConcept = (conceptId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    conceptId ? `/api/concepts/${conceptId}` : null,
    fetcher,
    options,
  )

  return {
    concept: data?.concepts ? (data.concepts[0] as Concept) : null,
    mutate,
    isLoading,
    error,
  }
}
