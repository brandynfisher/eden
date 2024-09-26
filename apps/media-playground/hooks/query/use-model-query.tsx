import { fetcher } from '@/lib/fetcher'
import { ModelV2, ModelsV2GetResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: ModelV2['_id']
  enabled?: boolean
  initialData?: ModelsV2GetResponse
}

export const useModelQuery = ({ key, enabled, initialData }: Props) => {
  const queryKey = ['models', key]

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
    enabled,
    initialData,
    queryKey,
    queryFn: () => fetcher<ModelsV2GetResponse>(`/api/models/${key}`),
  })

  const queryClient = useQueryClient()

  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    model: data?.model as ModelV2 | undefined,
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
