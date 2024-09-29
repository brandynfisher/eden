import { fetcher } from '@/lib/fetcher'
import { GeneratorV2, GeneratorsGetResponseV2 } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: GeneratorV2['key']
  initialData?: GeneratorsGetResponseV2
}

export const useGeneratorQuery = ({ key, initialData }: Props) => {
  const queryKey = ['generators', key]

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
    initialData,
    queryKey,
    queryFn: () => fetcher<GeneratorsGetResponseV2>(`/api/generators/${key}`),
  })

  const queryClient = useQueryClient()

  return {
    generator: data?.generator as GeneratorV2 | undefined,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    queryKey,
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
