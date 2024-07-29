import { fetcher } from '@/lib/fetcher'
import { Creator, CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

type Props = {
  key: Creator['username']
  initialData?: CreatorsGetResponse
}

export const useCreatorQuery = ({ key, initialData }: Props) => {
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
    queryKey: ['creators', key],
    queryFn: () => fetcher<CreatorsGetResponse>(`/api/users/${key}`),
  })

  return {
    creator: data?.creator as Creator | undefined,
    balance: data?.balance || undefined,
    foreverBalance: data?.foreverBalance || undefined,
    subscriptionBalance: data?.subscriptionBalance || undefined,
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
