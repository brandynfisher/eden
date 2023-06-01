import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useMyCreations = ({
  userId,
  isAuthenticated,
}: {
  userId: string
  isAuthenticated: boolean
}) => {
  const { data } = useSWR(
    isAuthenticated ? `/api/creations/user?userId=${userId}` : null,
    fetcher,
  )

  return {
    creations: isAuthenticated ? data?.creations : undefined,
  }
}
