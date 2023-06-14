import { fetcher } from '@/lib/fetcher'
import { Generator } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useGenerators = () => {
  const { data } = useSWR('/api/generators', fetcher, {
    refreshInterval: 0,
  })

  return {
    generators: data?.generators as Generator[] | undefined,
  }
}
