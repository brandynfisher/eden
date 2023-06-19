import { fetcher } from '@/lib/fetcher'
import { Creator } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useCreator = (creatorId: string) => {
  const { data, mutate } = useSWR(
    '/api/creators?creatorId=' + creatorId,
    fetcher,
  )

  return {
    creator: data?.creator as Creator | undefined,
    mutate,
  }
}
