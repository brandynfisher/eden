import { fetcher } from '@/lib/fetcher'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const generatorsListQueryKey = ['generators']

export const useGeneratorsListQuery = () => {
  const {
    data,
    error,
    isError,
    isPending,
    isLoading,
    isLoadingError,
    isRefetchError,
    isSuccess,
    status,
  } = useQuery({
    queryKey: generatorsListQueryKey,
    queryFn: () =>
      fetcher<{ generators: GeneratorV2[] }>('/api/generators?hideParams=true'),
  })

  return {
    generators: data?.generators as GeneratorV2[] | undefined,
    error,
    isError,
    isPending,
    isLoading,
    isLoadingError,
    isRefetchError,
    isSuccess,
    status,
  }
}
