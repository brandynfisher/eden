import { fetcher } from '@/lib/fetcher'
import { Collection } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCollection = (collectionId: string | null, options = {}) => {
  const { data, mutate } = useSWR(
    collectionId ? '/api/collections?collectionId=' + collectionId : null,
    fetcher,
    options,
  )

  return {
    collection: data?.collection as Collection | undefined,
    mutate,
  }
}
