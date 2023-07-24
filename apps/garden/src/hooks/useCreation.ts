import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCreation = (creationId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    creationId ? `/api/creations?creationId=${creationId}` : null,
    fetcher,
    options,
  )

  return {
    creation: data?.creation as Creation | null,
    mutate,
    isLoading,
    error,
  }
}
