import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

export const useCreation = (
  creationId: string,
  immutable = false,
  options = {},
) => {
  const { data, mutate } = immutable
    ? useSWRImmutable(
        '/api/creations?creationId=' + creationId,
        fetcher,
        options,
      )
    : useSWR('/api/creations?creationId=' + creationId, fetcher, options)

  return {
    creation: data?.creation as Creation | undefined,
    mutate,
  }
}
