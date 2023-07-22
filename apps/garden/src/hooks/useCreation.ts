import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

export const useCreation = (
  creationId: string,
  immutable = false,
  options = {},
) => {
  const apiPath = `/api/creations?creationId=${creationId}`
  const { data, mutate, isLoading, error } = immutable
    ? useSWRImmutable(apiPath, fetcher, options)
    : useSWR(apiPath, fetcher, options)

  return {
    creation: data?.creation as Creation | undefined,
    mutate,
    isLoading,
    error,
  }
}
