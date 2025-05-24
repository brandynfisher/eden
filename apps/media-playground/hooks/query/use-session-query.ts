import {
  Message,
  SessionV2,
  SessionsV2GetResponse,
  Thread,
} from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AxiosResponse } from 'axios'

export interface ThreadResponse {
  data: Thread
  status: number
}

export function useSessionQuery({
  sessionId,
  enabled = true,
}: {
  sessionId?: string
  enabled?: boolean
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const response: AxiosResponse<SessionsV2GetResponse> = await axios.get(
        `/api/sessions/${sessionId}`,
      )

      if (!response || !response.data.session) {
        throw new Error('Session not found')
      }

      return response.data.session
    },
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - sessions don't change often
    refetchOnWindowFocus: false,
  })

  const updateReaction = (message: Message) => {
    queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        messages: oldData.messages.map((ex: Message) => {
          if (ex._id === message._id) {
            return {
              ...ex,
              reactions: message.reactions,
            }
          }

          return ex
        }),
      }
    })
  }

  return {
    ...query,
    updateReaction,
  }
}
