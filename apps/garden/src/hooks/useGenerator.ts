import { fetcher } from '@/lib/fetcher'
import { Generator } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useGenerator = (generatorId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWRImmutable(
    generatorId ? `/api/generators/${generatorId}` : null,
    fetcher,
    options,
  )

  return {
    generator: data?.generator as Generator | null,
    mutate,
    isLoading,
    error,
  }
}
