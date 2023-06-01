import { fetcher } from '@/lib/fetcher'
import { Creation } from '@eden-labs/eden-sdk/dist/responses/CreationsGetResponse'
import useSWR from 'swr'

export const useCreations = () => {
  const { data } = useSWR('/api/creations/all', fetcher)

  return {
    creations: data?.creations as Creation[] | undefined,
  }
}
