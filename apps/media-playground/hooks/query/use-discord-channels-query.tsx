import { fetcher } from '@/lib/fetcher'
import { Agent, GetDiscordChannelsResponse } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  agentId: Agent['_id']
  enabled?: boolean
}

export const useDiscordChannelsQuery = ({ agentId, enabled = true }: Props) => {
  const queryKey: QueryKey = ['agents', agentId, 'discord-channels']

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
    queryFn: () =>
      fetcher<GetDiscordChannelsResponse>(
        `/api/agents/${agentId}/deployments/discord/channels`,
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const queryClient = useQueryClient()

  return {
    guilds: data?.guilds ?? [],
    lastRefreshedAt: data?.last_refreshed_at,
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
