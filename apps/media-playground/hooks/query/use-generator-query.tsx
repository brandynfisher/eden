import { fetcher } from '@/lib/fetcher'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

type Props = {
  key: GeneratorV2['key']
}

export const useGeneratorQuery = ({ key }: Props) => {
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
    queryKey: ['generator', key],
    queryFn: () =>
      fetcher<{ generator: GeneratorV2 }>(`/api/generators/${key}`),
  })

  return {
    generator: data?.generator as GeneratorV2 | undefined,
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
