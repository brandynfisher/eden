import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCreator = (creatorId: string | null, options = {}) => {
  const { data, mutate, isLoading, error } = useSWR(
    `/api/creators?creatorId=${creatorId || ''}`,
    fetcher,
    options,
  )

  return {
    creator: data?.creator as Creator | null,
    mutate,
    isLoading,
    error,
  }
}
