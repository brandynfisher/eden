import { fetcher } from '@/lib/fetcher'
import { Collection } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCollections = (
  userId?: string | null,
  creationId?: string | undefined,
) => {
  const { data, mutate } = useSWR(
    userId
      ? `/api/collections/list?userId=${userId}${
          creationId ? `&creationId=${creationId}` : ''
        }`
      : null,
    fetcher,
  )

  return {
    collections: data?.collections as Collection[] | undefined,
    refetchCollections: mutate,
  }
}
