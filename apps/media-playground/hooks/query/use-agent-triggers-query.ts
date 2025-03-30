import { fetcher } from '@/lib/fetcher'
import { Agent, AgentsGetTriggersResponse, Trigger } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: Agent['_id']
  initialData?: AgentsGetTriggersResponse
  enabled?: boolean
}

export const useAgentTriggersQuery = ({
  key,
  initialData,
  enabled = true,
}: Props) => {
  const queryKey: QueryKey = ['agents', key, 'triggers']

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
    queryFn: () =>
      fetcher<AgentsGetTriggersResponse>(`/api/agents/${key}/triggers`),
  })

  const queryClient = useQueryClient()

  return {
    triggers: (data?.triggers as Trigger[]) || [],
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
