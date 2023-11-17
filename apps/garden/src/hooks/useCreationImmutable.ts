import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useCreationImmutable = (creationId: string | null) => {
  const { data, isLoading, error } = useSWRImmutable(
    creationId ? `/api/creations/${creationId}` : null,
    fetcher,
  )

  return {
    creation: data?.creation as Creation | null,
    isLoading,
    error,
  }
}
