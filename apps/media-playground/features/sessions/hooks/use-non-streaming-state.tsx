'use client'

import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import { Creator, Message, SessionV2 } from '@edenlabs/eden-sdk'
import { createSessionsV3Api } from '@edenlabs/eden-sdk-v3'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'

interface UseNonStreamingStateProps {
  sessionId: string
  session?: SessionV2
  enabled: boolean
  onError: (error: string) => void
  user?: Creator
  onSessionCreated?: (sessionId: string) => void
}

const createApi = (token: string) =>
  createSessionsV3Api({
    baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
    token,
  })

export function useNonStreamingState({
  sessionId,
  session,
  enabled,
  onError,
  user,
  onSessionCreated,
}: UseNonStreamingStateProps): {
  waitingForResponse: boolean
  optimisticMessages: Message[]
  respondingAgentIds: string[]
  setWaitingForResponse: Dispatch<SetStateAction<boolean>>
  setOptimisticMessages: Dispatch<SetStateAction<Message[]>>
  sendMessage: (
    content: string,
    attachments?: string[],
    options?: {
      agent_ids?: string[]
      thinking?: boolean
      session_run_id?: string
    },
  ) => Promise<void>
  clearResponseState: () => void
  clearNonStreamingState: () => void
} {
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [waitingStartedAt, setWaitingStartedAt] = useState<number | null>(null)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [respondingAgentIds, setRespondingAgentIds] = useState<string[]>([])
  const { getToken } = useAuth()

  useEffect(() => {
    if (waitingForResponse && waitingStartedAt === null) {
      setWaitingStartedAt(Date.now())
    }
    if (!waitingForResponse && waitingStartedAt !== null) {
      setWaitingStartedAt(null)
    }
  }, [waitingForResponse, waitingStartedAt])

  // Clear waiting state when websocket delivers response
  useEffect(() => {
    if (enabled && waitingForResponse && session?.messages) {
      const lastMessage = session.messages[session.messages.length - 1]
      const lastMessageTimestamp = lastMessage?.createdAt
        ? new Date(lastMessage.createdAt).getTime()
        : null
      const hasNewResponse =
        lastMessageTimestamp !== null &&
        waitingStartedAt !== null &&
        lastMessageTimestamp > waitingStartedAt

      if (lastMessage && lastMessage.role !== 'user' && hasNewResponse) {
        setWaitingForResponse(false)
        setRespondingAgentIds([])
      }
    }
  }, [session?.messages, waitingForResponse, enabled, waitingStartedAt])

  // Clear optimistic messages when real messages arrive
  useEffect(() => {
    if (
      enabled &&
      session?.messages &&
      optimisticMessages.length > 0 &&
      waitingStartedAt !== null
    ) {
      const hasRealUserMessage = session.messages.some((msg: Message) => {
        if (msg.role !== 'user') return false
        const msgTimestamp = msg.createdAt
          ? new Date(msg.createdAt).getTime()
          : null
        if (msgTimestamp === null || msgTimestamp <= waitingStartedAt) {
          return false
        }

        return optimisticMessages.some(
          opt =>
            opt.role === 'user' &&
            opt.content === msg.content &&
            Math.abs(
              new Date(msg.createdAt).getTime() -
                new Date(opt.createdAt).getTime(),
            ) < 10000,
        )
      })

      if (hasRealUserMessage) {
        setOptimisticMessages(prev =>
          prev.filter(
            opt =>
              !(
                opt.role === 'user' &&
                session.messages.some(
                  (real: Message) =>
                    real.role === 'user' &&
                    real.content === opt.content &&
                    Math.abs(
                      new Date(real.createdAt).getTime() -
                        new Date(opt.createdAt).getTime(),
                    ) < 10000,
                )
              ),
          ),
        )
      }
    }
  }, [session?.messages, optimisticMessages, enabled, waitingStartedAt])

  // Handle focus/visibility changes to clear stale waiting states on mobile
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && waitingForResponse) {
        if (session?.messages) {
          const lastMessage = session.messages[session.messages.length - 1]
          const lastMessageTimestamp = lastMessage?.createdAt
            ? new Date(lastMessage.createdAt).getTime()
            : null
          const hasNewResponse =
            lastMessageTimestamp !== null &&
            waitingStartedAt !== null &&
            lastMessageTimestamp > waitingStartedAt

          if (
            lastMessage &&
            lastMessage.role === 'assistant' &&
            hasNewResponse
          ) {
            setWaitingForResponse(false)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, waitingForResponse, session?.messages, waitingStartedAt])

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: string[],
      options?: {
        agent_ids?: string[]
        thinking?: boolean
        session_run_id?: string
      },
    ) => {
      // Store the agent IDs for the loading indicators
      if (options?.agent_ids) {
        setRespondingAgentIds(options.agent_ids)
      }
      if (!user) {
        return
      }

      try {
        let result: { session_id?: string } | undefined

        const token = await getToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        result = await createApi(token).prompt({
          session_run_id: options?.session_run_id,
          session_id: sessionId,
          actor_agent_ids: options?.agent_ids,
          thinking: options?.thinking,
          creation:
            (!sessionId ||
              sessionId === 'new' ||
              sessionId.startsWith('temp-')) &&
            options?.agent_ids
              ? { agent_ids: options.agent_ids }
              : undefined,
          message: {
            content,
            attachments: attachments ?? [],
          },
        })

        // Handle session creation for optimistic sessions
        if (
          result?.session_id &&
          (!sessionId || sessionId === 'new' || sessionId.startsWith('temp-'))
        ) {
          if (onSessionCreated) {
            onSessionCreated(result.session_id)
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        const message =
          error instanceof Error ? error.message : 'Failed to send message'
        onError(message)
        setWaitingForResponse(false)
        setRespondingAgentIds([])
      }
    },
    [user, sessionId, onError, onSessionCreated, getToken],
  )

  const clearResponseState = useCallback(() => {
    setWaitingForResponse(false)
    setRespondingAgentIds([])
    setWaitingStartedAt(null)
  }, [])

  const clearNonStreamingState = useCallback(() => {
    setWaitingForResponse(false)
    setOptimisticMessages([])
    setRespondingAgentIds([])
    setWaitingStartedAt(null)
  }, [])

  return {
    waitingForResponse,
    optimisticMessages,
    respondingAgentIds,
    setWaitingForResponse,
    setOptimisticMessages,
    sendMessage,
    clearResponseState,
    clearNonStreamingState,
  }
}
