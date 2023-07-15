import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

export const useCreation = (creationId: string, immutable = false) => {
  const { data, mutate } = immutable
    ? useSWRImmutable('/api/creations?creationId=' + creationId, fetcher)
    : useSWR('/api/creations?creationId=' + creationId, fetcher)

  return {
    creation: data?.creation as Creation | undefined,
    mutate,
  }
}
