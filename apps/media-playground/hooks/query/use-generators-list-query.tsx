import { fetcher } from '@/lib/fetcher'
import { GeneratorOutputTypeV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const generatorsListQueryKey = ['generators']

export const useGeneratorsListQuery = (query?: {
  outputType?: GeneratorOutputTypeV2[]
}) => {
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
    queryKey: [...generatorsListQueryKey, query?.outputType],
    queryFn: () =>
      fetcher<{
        generators: GeneratorV2[]
      }>(
        `/api/generators?hideParams=true${query?.outputType ? `&outputType=${query.outputType.map(outputType => outputType).join(',')}` : ''}`,
      ),
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
