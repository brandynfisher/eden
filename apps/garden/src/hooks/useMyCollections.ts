import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMyCollections = ({
  userId,
  isAuthenticated,
}: {
  userId: string
  isAuthenticated: boolean
}) => {
  const { data, mutate: refetchMyCollections } = useSWR(
    isAuthenticated ? `/api/collections/list?userId=${userId}` : null,
    fetcher,
  )

  return {
    collections: isAuthenticated ? data?.collections : undefined,
    refetchMyCollections,
  }
}
