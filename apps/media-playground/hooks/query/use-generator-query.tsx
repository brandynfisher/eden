import { fetcher } from '@/lib/fetcher'
import { Generator } from '@edenlabs/eden-sdk'
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
    queryFn: () => fetcher<{ generators: Generator[] }>('/api/generators'),
  })

  return {
    generators: data?.generators as Generator[] | undefined,
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
