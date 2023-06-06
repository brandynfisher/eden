import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useBalance = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) => {
  const { data, mutate: refetchMannaBalance } = useSWR(
    isAuthenticated ? '/api/balance' : null,
    fetcher,
  )

  return {
    manna: isAuthenticated ? data?.manna : undefined,
    refetchMannaBalance,
  }
}
