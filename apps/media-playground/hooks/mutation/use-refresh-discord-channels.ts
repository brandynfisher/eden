import { fetcher } from '@/lib/fetcher'
import { RefreshDiscordChannelsResponse } from '@edenlabs/eden-sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useRefreshDiscordChannels = (agentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Call the refresh endpoint
      const result = await fetcher<RefreshDiscordChannelsResponse>(
        `/api/agents/${agentId}/deployments/discord/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      // Invalidate and wait for refetch to complete
      await queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'discord-channels'],
      })

      return result
    },
    onSuccess: data => {
      toast.success(
        `Refreshed: ${data.guilds_count} servers, ${data.channels_count} channels`,
      )
    },
    onError: () => {
      toast.error('Failed to refresh Discord channels')
    },
  })
}
