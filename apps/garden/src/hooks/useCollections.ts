import { fetcher } from '@/lib/fetcher'
import { Collection } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useCollections = (userId: string) => {
  const { data } = useSWR(`/api/collections?userId=${userId}`, fetcher)

  return {
    collections: data?.collections as Collection[] | undefined,
  }
}
