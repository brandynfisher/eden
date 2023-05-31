import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useBalance = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) => {
  const { data } = useSWR(isAuthenticated ? '/api/balance' : null, fetcher)

  return {
    manna: isAuthenticated ? data?.manna : undefined,
  }
}
