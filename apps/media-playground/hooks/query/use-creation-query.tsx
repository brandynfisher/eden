import { fetcher } from '@/lib/fetcher'
import { CreationV2, CreationsV2GetResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

type Props = {
  key: CreationV2['_id']
  initialData?: CreationsV2GetResponse
}

export const useCreationQuery = ({ key, initialData }: Props) => {
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
    queryKey: ['creations', key],
    queryFn: () => fetcher<CreationsV2GetResponse>(`/api/creations/${key}`),
  })

  return {
    creation: data?.creation as CreationV2 | undefined,
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
