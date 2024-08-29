import { fetcher } from '@/lib/fetcher'
import { CreationV2, CreationsV2GetResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: CreationV2['_id']
  initialData?: CreationsV2GetResponse
}

export const useCreationQuery = ({ key, initialData }: Props) => {
  const queryKey = ['creations', key]

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
    queryFn: () => fetcher<CreationsV2GetResponse>(`/api/creations/${key}`),
  })

  const queryClient = useQueryClient()

  return {
    creation: data?.creation as CreationV2 | undefined,
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
