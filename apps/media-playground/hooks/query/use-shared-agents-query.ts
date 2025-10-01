import { fetcher } from '@/lib/fetcher'
import { Agent, AgentPermissionLevel } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

interface SharedAgent {
  agent: Agent
  permissionLevel: AgentPermissionLevel
  grantedAt: Date
}

interface SharedAgentsResponse {
  sharedAgents: SharedAgent[]
}

type Props = {
  initialData?: SharedAgentsResponse
  enabled?: boolean
}

export const useSharedAgentsQuery = ({
  initialData,
  enabled = true,
}: Props) => {
  const queryKey: QueryKey = ['agents', 'shared']

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
    queryFn: () => fetcher<SharedAgentsResponse>(`/api/agents/shared`),
  })

  const queryClient = useQueryClient()

  return {
    sharedAgents: (data?.sharedAgents as SharedAgent[]) || [],
    data,
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
