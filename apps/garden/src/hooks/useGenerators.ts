import { fetcher } from '@/lib/fetcher'
import { Generator } from '@eden-labs/eden-sdk/dist/responses/GeneratorsGetResponse'
import useSWR from 'swr'

export const useGenerators = () => {
  const { data } = useSWR('/api/generators', fetcher)

  return {
    generators: data?.generators as Generator[] | undefined,
  }
}
