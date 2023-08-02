import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useCreationsSimilar = (
  creationId: string | null,
  options = {},
) => {
  const { data, mutate, isLoading, error } = useSWRImmutable(
    creationId ? `/api/creations/similar?creationId=${creationId}` : null,
    fetcher,
    options,
  )

  return {
    creations: data?.creations as Creation[] | null,
    mutate,
    isLoading,
    error,
  }
}
