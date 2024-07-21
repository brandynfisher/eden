import { fetcher } from '@/lib/fetcher'
import { Creator, CreatorsGetMeResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

type Props = {
  key: Creator['username']
}

export const useCreatorQuery = ({ key }: Props) => {
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
    queryKey: ['creators', key],
    queryFn: () => fetcher<CreatorsGetMeResponse>(`/api/users/${key}`),
  })

  return {
    user: data?.creator as Creator | undefined,
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
