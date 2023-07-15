import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useCreations = () => {
  const { data } = useSWR('/api/creations/all', fetcher)

  return {
    creations: data?.creations as Creation[] | undefined,
  }
}
