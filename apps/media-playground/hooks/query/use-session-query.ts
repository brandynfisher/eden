import { SessionsV2GetResponse, Thread } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
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
  return useQuery({
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
}
