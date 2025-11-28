import { fetcher } from '@/lib/fetcher'
import {
  DEFAULT_REALTIME_SETTINGS,
  RealtimeSettings,
} from '@/lib/voice/realtime-defaults'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

// Re-export types for convenience
export type { RealtimeSettings as AgentRealtimeSettings } from '@/lib/voice/realtime-defaults'
export { DEFAULT_REALTIME_SETTINGS } from '@/lib/voice/realtime-defaults'

interface AgentRealtimeResponse {
  settings: RealtimeSettings
}

type Props = {
  agentId: string
  enabled?: boolean
}

export const useAgentRealtimeSettings = ({
  agentId,
  enabled = true,
}: Props) => {
  const queryKey: QueryKey = ['agent-realtime', agentId]

  const { data, error, isError, isPending, isLoading, isSuccess, status } =
    useQuery({
      enabled: enabled && !!agentId,
      queryKey,
      queryFn: async () => {
        try {
          const response = await fetcher<AgentRealtimeResponse>(
            `/api/agents/${agentId}/realtime`,
          )
          return response.settings
        } catch (err) {
          // If no settings exist (404), return defaults
          // The API should return defaults anyway, but this is a fallback
          console.warn(
            'Failed to fetch realtime settings, using defaults:',
            err,
          )
          return { ...DEFAULT_REALTIME_SETTINGS, agent: agentId }
        }
      },
      // Use defaults while loading
      placeholderData: { ...DEFAULT_REALTIME_SETTINGS, agent: agentId },
    })

  const queryClient = useQueryClient()

  // Merge fetched settings with defaults to ensure all fields exist
  const settings: RealtimeSettings = {
    ...DEFAULT_REALTIME_SETTINGS,
    ...data,
    agent: agentId,
  }

  return {
    settings,
    queryKey,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    error,
    isError,
    isPending,
    isLoading,
    isSuccess,
    status,
  }
}
