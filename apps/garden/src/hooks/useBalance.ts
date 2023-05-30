import { fetcher } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { useContext, useEffect } from 'react'
import useSWR from 'swr'

export const useBalance = () => {
  const { isAuthenticated } = useContext(UserContext)
  const { data, mutate } = useSWR('/api/balance', fetcher)

  useEffect(() => {
    mutate()
  }, [isAuthenticated, mutate])

  return {
    manna: data?.manna,
  }
}
