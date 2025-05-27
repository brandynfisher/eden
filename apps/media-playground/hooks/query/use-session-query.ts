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

// Temporary ID prefix for optimistic messages
const OPTIMISTIC_ID_PREFIX = 'optimistic_'

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

  const addOptimisticMessage = (
    message: Partial<Message> & { content: string; sender: Message['sender'] },
  ) => {
    const optimisticId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}`
    const optimisticMessage: Message & { __optimistic: boolean } = {
      _id: optimisticId,
      session: sessionId,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Mark as optimistic for identification
      __optimistic: true,
      ...message,
    }

    queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        messages: [...oldData.messages, optimisticMessage],
      }
    })

    return optimisticId
  }

  const removeOptimisticMessage = (optimisticId: string) => {
    queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        messages: oldData.messages.filter(msg => msg._id !== optimisticId),
      }
    })
  }

  const confirmOptimisticMessage = (
    optimisticId: string,
    confirmedMessage: Message,
  ) => {
    queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        messages: oldData.messages.map(msg =>
          msg._id === optimisticId ? confirmedMessage : msg,
        ),
      }
    })
  }

  const addOrUpdateMessage = (newMessage: Message) => {
    // Filter out tool messages - they shouldn't be displayed in the UI
    if (newMessage.role === 'tool') {
      return
    }

    queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
      if (!oldData) return oldData

      const existingMessages = oldData.messages || []
      const existingMessageIndex = existingMessages.findIndex(
        (m: Message) => m._id === newMessage._id,
      )

      let updatedMessages = [...existingMessages]

      if (existingMessageIndex === -1) {
        // New message - add it to the end (but check if it's not replacing an optimistic one)
        const optimisticIndex = existingMessages.findIndex(
          (m: Message & { __optimistic?: boolean }) =>
            m.__optimistic && m.content === newMessage.content,
        )

        if (optimisticIndex !== -1) {
          // Replace the optimistic message
          updatedMessages[optimisticIndex] = newMessage
        } else {
          // Add new message
          updatedMessages.push(newMessage)
        }
      } else {
        // Existing message - update it
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          ...newMessage,
        }
      }

      return {
        ...oldData,
        messages: updatedMessages,
      }
    })
  }

  return {
    ...query,
    updateReaction,
    addOptimisticMessage,
    removeOptimisticMessage,
    confirmOptimisticMessage,
    addOrUpdateMessage,
  }
}
