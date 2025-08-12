import { fetcher } from '@/lib/fetcher'
import { AgentPermission } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

interface PermissionsResponse {
  permissions: AgentPermission[]
}

type Props = {
  key: string
  initialData?: PermissionsResponse
  enabled?: boolean
}

export const useAgentPermissionsQuery = ({
  key,
  initialData,
  enabled = true,
}: Props) => {
  const queryKey: QueryKey = ['agents', key, 'permissions']

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
    queryFn: () => fetcher<PermissionsResponse>(`/api/agents/${key}/permissions`),
  })

  const queryClient = useQueryClient()

  return {
    permissions: (data?.permissions as AgentPermission[]) || [],
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