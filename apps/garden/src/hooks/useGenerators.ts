import { fetcher } from '@/lib/fetcher'
import { Generator } from '@eden-labs/eden-sdk'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

export const useGenerators = (immutable: boolean) => {
  const { data } = immutable
    ? useSWRImmutable('/api/generators', fetcher)
    : useSWR('/api/generators', fetcher, {
        refreshInterval: 0,
      })

  return {
    generators: data?.generators as Generator[] | undefined,
  }
}
