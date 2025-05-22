import {
  SessionContentMessage,
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
    staleTime: 0,
  })

  const updateReaction = (message: SessionContentMessage) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryClient.setQueryData(['session', sessionId], (oldData: any) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        messages: oldData.messages.map((ex: SessionContentMessage) => {
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
