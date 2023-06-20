import { fetcher } from '@/lib/fetcher'
import { Collection } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useCollection = (collectionId: string) => {
  const { data, mutate } = useSWR(
    '/api/collections?collectionId=' + collectionId,
    fetcher,
  )

  return {
    collection: data?.collection as Collection | undefined,
    mutate,
  }
}
