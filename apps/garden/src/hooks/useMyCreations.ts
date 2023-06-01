import { fetcher } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@eden-labs/eden-sdk/dist/responses/CreationsGetResponse'
import { useContext } from 'react'
import useSWR from 'swr'

export const useMyCreations = () => {
  const { address } = useContext(UserContext)
  const { data } = useSWR(`/api/creations/user?userId=${address}`, fetcher, {
    refreshInterval: 0,
  })

  return {
    creations: data?.creations as Creation[] | undefined,
  }
}
