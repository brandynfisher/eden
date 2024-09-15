import { fetcher } from '@/lib/fetcher'
import { ApiKeysListResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  initialData?: ApiKeysListResponse
}

export const useApiKeysQuery = ({ initialData }: Props) => {
  const queryKey = ['api-keys']

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
    queryFn: () =>
      fetcher<{
        apiKeys: ApiKeysListResponse['docs']
      }>(`/api/apikeys`),
  })

  const queryClient = useQueryClient()

  return {
    apiKeys: (data?.apiKeys as ApiKeysListResponse['docs']) || [],
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
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
