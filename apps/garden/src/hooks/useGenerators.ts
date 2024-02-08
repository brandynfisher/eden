import { fetcher } from '@/lib/fetcher'
import { Generator } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useGenerators = () => {
  const { data } = useSWRImmutable('/api/generators?visible=true', fetcher)

  return {
    generators: data?.generators as Generator[] | undefined,
  }
}
