import { fetcher } from '@/lib/fetcher'
import {
  Agent,
  AgentsGetDeploymentsResponse,
  Deployment,
} from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: Agent['_id']
  initialData?: AgentsGetDeploymentsResponse
  enabled?: boolean
}

export const useAgentDeploymentsQuery = ({
  key,
  initialData,
  enabled = true,
}: Props) => {
  const queryKey: QueryKey = ['agents', key, 'deployments']

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
      fetcher<AgentsGetDeploymentsResponse>(`/api/agents/${key}/deployments`),
  })

  const queryClient = useQueryClient()

  return {
    deployments: data?.deployments as Deployment[] | undefined,
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
