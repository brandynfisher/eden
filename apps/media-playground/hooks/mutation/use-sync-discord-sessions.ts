import { fetcher } from '@/lib/fetcher'
import { SyncDiscordSessionsResponse } from '@edenlabs/eden-sdk'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useSyncDiscordSessions = (agentId: string) => {
  return useMutation({
    mutationFn: async () => {
      const result = await fetcher<SyncDiscordSessionsResponse>(
        `/api/agents/${agentId}/deployments/discord/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return result
    },
    onSuccess: data => {
      toast.success(
        `Synced ${data.sessions_count} session${
          data.sessions_count === 1 ? '' : 's'
        }`,
      )
    },
    onError: () => {
      toast.error('Failed to sync Discord sessions')
    },
  })
}
