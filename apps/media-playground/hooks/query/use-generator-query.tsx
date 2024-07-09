import { fetcher } from '@/lib/fetcher'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const useGeneratorsQuery = () => {
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
    queryKey: ['generators'],
    queryFn: () => fetcher<{ generators: GeneratorV2[] }>('/api/generators'),
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
