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
  parentSessionId,
  enabled = true,
}: {
  sessionId?: string
  parentSessionId?: string
  enabled?: boolean
}) {
  const queryClient = useQueryClient()

  // Build a consistent query key - only include parentSessionId if it's defined
  const queryKey = parentSessionId
    ? ['session', sessionId, parentSessionId]
    : ['session', sessionId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = parentSessionId
        ? `?parent_session_id=${parentSessionId}`
        : ''
      const response: AxiosResponse<SessionsV2GetResponse> = await axios.get(
        `/api/sessions/${sessionId}${params}`,
      )

      if (!response || !response.data.session) {
        throw new Error('Session not found')
      }

      // Store pagination metadata - but don't overwrite if user has already loaded older messages
      // The initial fetch always gets the latest 25 messages, so it doesn't know about the full pagination state
      const existingPagination = queryClient.getQueryData([
        'session-pagination',
        sessionId,
      ]) as { nextCursor?: string; hasMore?: boolean } | undefined

      // Only update pagination if we don't have existing data, or if hasMore was true and is now false
      // This prevents refetches from resetting hasMore back to true when user has loaded all messages
      if (
        !existingPagination ||
        (response.data.hasMore === false && existingPagination.hasMore === true)
      ) {
        queryClient.setQueryData(['session-pagination', sessionId], {
          nextCursor: response.data.nextCursor,
          hasMore: response.data.hasMore,
        })
      }

      // Merge with existing older messages if they exist
      const existingSession = queryClient.getQueryData(queryKey) as
        | SessionV2
        | undefined

      if (existingSession?.messages) {
        const newMessageIds = new Set(
          response.data.session.messages.map(m => m._id),
        )
        // Filter older messages, excluding optimistic messages (they should be replaced by real messages from API)
        const olderMessages = existingSession.messages.filter(
          m =>
            !newMessageIds.has(m._id) &&
            !m._id.startsWith(OPTIMISTIC_ID_PREFIX),
        )

        // Prepend older messages to the new session data
        return {
          ...response.data.session,
          messages: [...olderMessages, ...response.data.session.messages],
        }
      }

      return response.data.session
    },
    enabled: enabled && !!sessionId,
    staleTime: 1000, // 1 second - allow frequent refetches during active conversation
    refetchInterval: data => {
      // Only poll for the active session to avoid flooding
      return data ? 2000 : false
    }, // Poll only when we have session data
    refetchOnWindowFocus: query => !!query.state.data,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401 || status === 403) {
          return false
        }
      }
      return failureCount < 3
    },
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
        session: [sessionId] as unknown as SessionV2[],
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

        const existingMessages = oldData.messages || []
        // Enrich assistant messages with complete agent data if sender info is missing/incomplete
        let enrichedMessage = newMessage
        if (newMessage.role === 'assistant') {
          const existingSender = existingMessages.find(
            m => m._id === newMessage._id,
          )?.sender

          // Some webhook updates omit or clear sender; prefer existing sender, then fallback to single-agent session agent.
          const incomingSender =
            (newMessage.sender as unknown as
              | Record<string, unknown>
              | null
              | undefined) ||
            (existingSender as unknown as
              | Record<string, unknown>
              | null
              | undefined) ||
            (oldData.agents && oldData.agents.length === 1
              ? (oldData.agents[0] as unknown as Record<string, unknown>)
              : undefined)

          if (incomingSender) {
            const senderObj = incomingSender as {
              _id?: string
              username?: string
              name?: string
              userImage?: string
            }

            const matchingAgent =
              oldData.agents?.find(
                agent =>
                  agent._id === senderObj._id ||
                  (senderObj.username && agent.username === senderObj.username),
              ) ||
              (oldData.agents?.length === 1 ? oldData.agents[0] : undefined)

            const hasIncompleteUserImage =
              !senderObj.userImage ||
              senderObj.userImage === '' ||
              (typeof senderObj.userImage === 'string' &&
                !senderObj.userImage.startsWith('https://'))

            const hasIncompleteName = !senderObj.name || senderObj.name === ''

            const hasIncompleteUsername =
              !senderObj.username || senderObj.username === ''

            if (
              matchingAgent &&
              (hasIncompleteUserImage ||
                hasIncompleteName ||
                hasIncompleteUsername)
            ) {
              enrichedMessage = {
                ...newMessage,
                sender: {
                  ...senderObj,
                  name: hasIncompleteName ? matchingAgent.name : senderObj.name,
                  username: hasIncompleteUsername
                    ? matchingAgent.username
                    : senderObj.username,
                  _id: senderObj._id || matchingAgent._id,
                  // If senderObj.userImage is a filename, convert it; otherwise fall back to agent's userImage.
                  userImage: hasIncompleteUserImage
                    ? getCloudfrontUrl(
                        senderObj.userImage || matchingAgent.userImage,
                      )
                    : senderObj.userImage,
                } as Message['sender'],
              }
            } else if (!newMessage.sender && incomingSender) {
              // Ensure we keep a sender for assistant messages even if the incoming payload omitted it.
              enrichedMessage = {
                ...newMessage,
                sender: incomingSender as Message['sender'],
              }
            }
          }
        }

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
          const mergedSender =
            enrichedMessage.role === 'assistant' &&
            (!('sender' in enrichedMessage) ||
              enrichedMessage.sender === null ||
              enrichedMessage.sender === undefined ||
              (typeof enrichedMessage.sender === 'object' &&
                enrichedMessage.sender &&
                Object.keys(enrichedMessage.sender).length === 0))
              ? existingMessage.sender
              : enrichedMessage.sender

          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            ...enrichedMessage,
            // Explicitly preserve thought field if it exists in either message
            thought: mergedThought,
            // Preserve sender if webhook update omitted/cleared it
            sender: mergedSender,
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

  const removeMessage = useCallback(
    (messageId: string) => {
      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          messages: oldData.messages.filter(msg => msg._id !== messageId),
        }
      })
    },
    [queryClient, sessionId],
  )

  const updateToolCall = useCallback(
    (toolName: string, toolIndex: number, result: unknown) => {
      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        const updatedMessages = oldData.messages.map((msg: Message) => {
          // Find the assistant message with tool_calls
          if (msg.role === 'assistant' && msg.tool_calls) {
            const updatedToolCalls = msg.tool_calls.map((tc, idx) => {
              // Match by tool name and index
              if (tc.function?.name === toolName && idx === toolIndex) {
                return {
                  ...tc,
                  result: result,
                }
              }
              return tc
            })

            return {
              ...msg,
              tool_calls: updatedToolCalls,
            }
          }
          return msg
        })

        return {
          ...oldData,
          messages: updatedMessages,
        }
      })
    },
    [queryClient, sessionId],
  )

  const fetchOlderMessages = useCallback(async () => {
    const paginationData = queryClient.getQueryData([
      'session-pagination',
      sessionId,
    ]) as { nextCursor?: string; hasMore?: boolean } | undefined

    if (!paginationData?.hasMore || !paginationData?.nextCursor) {
      return { hasMore: false, messages: [] }
    }

    try {
      const response = await axios.get(`/api/sessions/${sessionId}/messages`, {
        params: {
          cursor: paginationData.nextCursor,
          limit: 25,
        },
      })

      if (!response || !response.data.messages) {
        // Mark as no more messages to prevent infinite loop
        queryClient.setQueryData(['session-pagination', sessionId], {
          nextCursor: undefined,
          hasMore: false,
        })
        throw new Error('Failed to fetch older messages')
      }

      const olderMessages = response.data.messages

      // Update pagination metadata
      queryClient.setQueryData(['session-pagination', sessionId], {
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      })

      // Prepend older messages to existing messages (deduplicate by _id)
      // Use the same queryKey pattern as the main query
      queryClient.setQueryData(queryKey, (oldData: SessionV2) => {
        if (!oldData) return oldData

        const existingIds = new Set(oldData.messages.map(m => m._id))
        // @ts-ignore
        const newMessages = olderMessages.filter(m => !existingIds.has(m._id))

        return {
          ...oldData,
          messages: [...newMessages, ...oldData.messages],
        }
      })

      return {
        hasMore: response.data.hasMore || false,
        messages: olderMessages,
      }
    } catch (error) {
      // Don't permanently kill pagination on error - allow retry
      // Just log and return empty result, preserving the existing pagination state
      console.error(
        '[fetchOlderMessages] Error fetching older messages:',
        error,
      )
      throw error
    }
  }, [queryClient, sessionId, queryKey])

  const getPaginationData = useCallback(() => {
    return queryClient.getQueryData(['session-pagination', sessionId]) as
      | { nextCursor?: string; hasMore?: boolean }
      | undefined
  }, [queryClient, sessionId])

  return {
    ...query,
    updateReaction,
    addOptimisticMessage,
    removeOptimisticMessage,
    confirmOptimisticMessage,
    addOrUpdateMessage,
    removeMessage,
    updateToolCall,
    fetchOlderMessages,
    getPaginationData,
  }
}
