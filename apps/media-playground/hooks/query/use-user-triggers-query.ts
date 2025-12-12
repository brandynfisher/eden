import { fetcher } from '@/lib/fetcher'
import { Trigger } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

interface TriggersResponse {
  triggers: Trigger[]
}

type Props = {
  enabled?: boolean
}

export const useUserTriggersQuery = ({ enabled = true }: Props = {}) => {
  const queryKey: QueryKey = ['user', 'triggers']

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
    queryKey,
    queryFn: () => fetcher<TriggersResponse>('/api/triggers'),
  })

  const queryClient = useQueryClient()

  return {
    triggers: data?.triggers || [],
    queryKey,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    fetch: () => queryClient.fetchQuery({ queryKey }),
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
