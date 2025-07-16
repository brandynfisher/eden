import { Creator, Message, SessionV2 } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useState } from 'react'

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
}: UseNonStreamingStateProps) {
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])

  // Clear waiting state when websocket delivers response
  useEffect(() => {
    if (enabled && waitingForResponse && session?.messages) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        setWaitingForResponse(false)
        setOptimisticMessages([])
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
      options?: { agent_ids?: string[] },
    ) => {
      if (!user) {
        console.log('***debug*** Non-streaming: no user, cannot send message')
        return
      }

      try {
        console.log(
          '***debug*** Non-streaming: sending message to /api/sessions/prompt',
        )
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
          throw new Error('Failed to send message')
        }

        // Handle session creation for optimistic sessions
        if (!sessionId || sessionId.startsWith('temp-')) {
          const result = await response.json()
          if (result.session_id && onSessionCreated) {
            console.log(
              '***debug*** Non-streaming: session created, calling onSessionCreated',
            )
            onSessionCreated(result.session_id)
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        onError('Failed to send message')
        setWaitingForResponse(false)
        setOptimisticMessages([])
      }
    },
    [user, sessionId, onError, onSessionCreated],
  )

  const clearNonStreamingState = useCallback(() => {
    console.log('***debug*** Non-streaming: clearing all state')
    setWaitingForResponse(false)
    setOptimisticMessages([])
  }, [])

  return {
    waitingForResponse,
    optimisticMessages,
    setWaitingForResponse,
    setOptimisticMessages,
    sendMessage,
    clearNonStreamingState,
  }
}
