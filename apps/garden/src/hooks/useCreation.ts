import { fetcher } from '@/lib/fetcher'
import { Creation } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useCreation = (creationId: string) => {
  const { data } = useSWR('/api/creations?creationId=' + creationId, fetcher)

  return {
    creation: data?.creation as Creation | undefined,
  }
}
