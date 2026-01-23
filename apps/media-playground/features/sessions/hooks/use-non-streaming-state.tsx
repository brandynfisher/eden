import { Creator, Message, SessionV2 } from '@edenlabs/eden-sdk'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'

interface UseNonStreamingStateProps {
  sessionId: string
  session?: SessionV2 // Made optional
  enabled: boolean
  onError: (error: string) => void
  user?: Creator // Made optional
  onSessionCreated?: (sessionId: string) => void
}

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
    options?: { agent_ids?: string[]; thinking?: boolean },
  ) => Promise<void>
  clearResponseState: () => void
  clearNonStreamingState: () => void
} {
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [respondingAgentIds, setRespondingAgentIds] = useState<string[]>([])

  // Clear waiting state when websocket delivers response
  useEffect(() => {
    if (enabled && waitingForResponse && session?.messages) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (lastMessage && lastMessage.role !== 'user') {
        setWaitingForResponse(false)
        setOptimisticMessages([])
        setRespondingAgentIds([])
      }
    }
  }, [session?.messages, waitingForResponse, enabled])

  // Clear optimistic messages when real messages arrive
  useEffect(() => {
    if (enabled && session?.messages && optimisticMessages.length > 0) {
      const hasRealUserMessage = session.messages.some(
        (msg: Message) =>
          msg.role === 'user' &&
          optimisticMessages.some(
            opt =>
              opt.role === 'user' &&
              opt.content === msg.content &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(opt.createdAt).getTime(),
              ) < 10000,
          ),
      )

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
  }, [session?.messages, optimisticMessages, enabled])

  // Handle focus/visibility changes to clear stale waiting states on mobile
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && waitingForResponse) {
        if (session?.messages) {
          const lastMessage = session.messages[session.messages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            setWaitingForResponse(false)
            setOptimisticMessages([])
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, waitingForResponse, session?.messages])

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: string[],
      options?: { agent_ids?: string[]; thinking?: boolean },
    ) => {
      // Store the agent IDs for the loading indicators
      if (options?.agent_ids) {
        setRespondingAgentIds(options.agent_ids)
      }
      if (!user) {
        return
      }

      try {
        const response = await fetch('/api/sessions/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            content,
            attachments,
            ...options,
          }),
        })

        if (!response.ok) {
          let message = 'Failed to send message'
          try {
            const data = await response.json()
            message = data?.message || data?.error || message
          } catch {
            // Ignore JSON parse errors
          }
          throw new Error(message)
        }

        // Handle session creation for optimistic sessions
        if (
          !sessionId ||
          sessionId === 'new' ||
          sessionId.startsWith('temp-')
        ) {
          const result = await response.json()
          if (result.session_id && onSessionCreated) {
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
    [user, sessionId, onError, onSessionCreated],
  )

  const clearResponseState = useCallback(() => {
    setWaitingForResponse(false)
    setRespondingAgentIds([])
  }, [])

  const clearNonStreamingState = useCallback(() => {
    setWaitingForResponse(false)
    setOptimisticMessages([])
    setRespondingAgentIds([])
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
