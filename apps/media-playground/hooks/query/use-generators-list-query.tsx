import { fetcher } from '@/lib/fetcher'
import { GeneratorOutputTypeV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const generatorsListQueryKey = ['generators']

export const useGeneratorsListQuery = (query?: {
  output_type?: GeneratorOutputTypeV2[]
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
    queryKey: [...generatorsListQueryKey, query?.output_type],
    queryFn: () =>
      fetcher<{
        generators: GeneratorV2[]
      }>(
        `/api/generators?hideParams=true${
          query?.output_type
            ? `&output_type=${query.output_type
                .map(outputType => outputType)
                .join(',')}`
            : ''
        }`,
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
