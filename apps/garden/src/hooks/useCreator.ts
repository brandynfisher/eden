import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCreator = (creatorId: string) => {
  const { data, mutate, isLoading, error } = useSWR(
    `/api/creators?creatorId=${creatorId}`,
    fetcher,
  )

  return {
    creator: data?.creator as Creator | undefined,
    mutate,
    isLoading,
    error,
  }
}
