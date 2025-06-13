'use client'

import {
  SessionsV2MessageArguments,
  SessionsV2MessageResponse,
} from '@edenlabs/eden-sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export const useSessionMessageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      args: SessionsV2MessageArguments,
    ): Promise<SessionsV2MessageResponse> => {
      const response = await axios.post('/api/sessions', args)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate session queries
      if ('session_id' in data && data.session_id) {
        queryClient.invalidateQueries({
          queryKey: ['session', data.session_id],
        })
      }

      // Invalidate session list queries for the agent
      if (variables.agent_ids && variables.agent_ids.length > 0) {
        variables.agent_ids.forEach(agentId => {
          queryClient.invalidateQueries({
            queryKey: ['sessions', 'list', 'agent', agentId],
          })
        })
      }
    },
    onError: (error: any) => {
      toast.error('Failed to send message', {
        description:
          error?.response?.data?.message || 'Please try again later.',
        dismissible: true,
        richColors: true,
      })
    },
  })
}
