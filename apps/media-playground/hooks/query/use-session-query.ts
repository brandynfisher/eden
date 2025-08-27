import { getCloudfrontUrl } from '@/lib/media'
import {
  Message,
  SessionV2,
  SessionsV2GetResponse,
  Thread,
} from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AxiosResponse } from 'axios'
import { useCallback } from 'react'

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

  const updateReaction = useCallback(
    (message: Message) => {
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
    },
    [queryClient, sessionId],
  )

  const addOptimisticMessage = useCallback(
    (
      message: Partial<Message> & {
        content: string
        sender: Message['sender']
      },
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
    },
    [queryClient, sessionId],
  )

  const removeOptimisticMessage = useCallback(
    (optimisticId: string) => {
      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          messages: oldData.messages.filter(msg => msg._id !== optimisticId),
        }
      })
    },
    [queryClient, sessionId],
  )

  const confirmOptimisticMessage = useCallback(
    (optimisticId: string, confirmedMessage: Message) => {
      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          messages: oldData.messages.map(msg =>
            msg._id === optimisticId ? confirmedMessage : msg,
          ),
        }
      })
    },
    [queryClient, sessionId],
  )

  const addOrUpdateMessage = useCallback(
    (newMessage: Message) => {
      // Filter out tool messages - they shouldn't be displayed in the UI
      if (newMessage.role === 'tool') {
        return
      }

      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        // Enrich assistant messages with complete agent data if sender info is incomplete
        let enrichedMessage = newMessage
        if (newMessage.role === 'assistant' && newMessage.sender) {
          let matchingAgent = null

          if (oldData.agents) {
            matchingAgent = oldData.agents.find(
              agent =>
                agent._id === newMessage.sender?._id ||
                agent.username === newMessage.sender?.username,
            )
          }

          // Check if sender data is incomplete (missing userImage or has empty/default values)
          const hasIncompleteUserImage =
            !newMessage.sender.userImage ||
            newMessage.sender.userImage === '' ||
            newMessage.sender.userImage === null ||
            newMessage.sender.userImage === undefined ||
            !newMessage.sender.userImage.startsWith('https://') // Also check if it's a filename instead of URL

          const hasIncompleteName =
            !newMessage.sender.name ||
            newMessage.sender.name === '' ||
            newMessage.sender.name === null ||
            newMessage.sender.name === undefined

          if (matchingAgent && (hasIncompleteUserImage || hasIncompleteName)) {
            enrichedMessage = {
              ...newMessage,
              sender: {
                ...newMessage.sender,
                name: hasIncompleteName
                  ? matchingAgent.name
                  : newMessage.sender.name,
                // Convert filename to URL using same function as message components
                userImage: hasIncompleteUserImage
                  ? getCloudfrontUrl(matchingAgent.userImage)
                  : newMessage.sender.userImage,
                // Keep other fields from the original sender
                username: newMessage.sender.username || matchingAgent.username,
                _id: newMessage.sender._id || matchingAgent._id,
              },
            }
          }
        }

        const existingMessages = oldData.messages || []
        const existingMessageIndex = existingMessages.findIndex(
          (m: Message) => m._id === enrichedMessage._id,
        )

        let updatedMessages = [...existingMessages]

        if (existingMessageIndex === -1) {
          // New message - add it to the end (but check if it's not replacing an optimistic one)
          const optimisticIndex = existingMessages.findIndex(
            (m: Message & { __optimistic?: boolean }) =>
              m.__optimistic && m.content === enrichedMessage.content,
          )

          if (optimisticIndex !== -1) {
            // Replace the optimistic message
            updatedMessages[optimisticIndex] = enrichedMessage
          } else {
            // Add new message
            updatedMessages.push(enrichedMessage)
          }
        } else {
          // Existing message - update it, ensuring we preserve all fields including thought
          const existingMessage = updatedMessages[existingMessageIndex]
          const mergedThought =
            enrichedMessage.thought || existingMessage.thought

          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            ...enrichedMessage,
            // Explicitly preserve thought field if it exists in either message
            thought: mergedThought,
          }
        }

        return {
          ...oldData,
          messages: updatedMessages,
        }
      })
    },
    [queryClient, sessionId],
  )

  return {
    ...query,
    updateReaction,
    addOptimisticMessage,
    removeOptimisticMessage,
    confirmOptimisticMessage,
    addOrUpdateMessage,
  }
}
