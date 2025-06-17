'use client'

import { ErrorDisplay } from './components/error-display'
import { MessageInput } from './components/message-input'
import { SessionTopBar } from './components/session-top-bar'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Session = ({
  optimisticSessionId,
}: { optimisticSessionId?: string } = {}) => {
  const params = useParams()
  const router = useRouter()
  const sessionId = optimisticSessionId || (params.id as string)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingTokens, setIsStreamingTokens] = useState(false)
  const [hasReceivedTokens, setHasReceivedTokens] = useState(false)
  const [waitingForWebSocket, setWaitingForWebSocket] = useState(false)
  const [streamingAgent, setStreamingAgent] = useState<{
    _id: string
    username: string
    name: string
    userImage?: string
  } | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  // Error handling
  const { errors, addError, removeError, clearErrors } = useSessionErrors()

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Clear streaming state when websocket delivers the real message
  useEffect(() => {
    if (
      waitingForWebSocket &&
      streamingMessageIdRef.current &&
      session?.messages
    ) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (
        lastMessage &&
        lastMessage.content === streamingMessageIdRef.current
      ) {
        setStreamingText('')
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
        setWaitingForWebSocket(false)
        setStreamingAgent(null)
        streamingMessageIdRef.current = null
      }
    }
  }, [session?.messages, waitingForWebSocket])

  // Error handling function
  const handleStreamingError = useCallback(
    (error: string) => {
      console.error('Streaming error:', error)

      // Clear streaming state
      setStreamingText('')
      setIsStreamingTokens(false)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      setStreamingAgent(null)
      streamingMessageIdRef.current = null

      // Determine error type and add appropriate error
      if (
        error.toLowerCase().includes('budget') ||
        error.toLowerCase().includes('quota')
      ) {
        addError({
          type: 'budget_exceeded',
          message:
            'Your session budget has been exceeded. Please top up or increase budget.',
          recoveryAction: {
            label: 'Update budget',
            //should be updated with actual section that allows user to top up or increase budget
            action: () => router.push('/billing'),
          },
          dismissible: true,
        })
      } else if (error.toLowerCase().includes('rate limit')) {
        addError({
          type: 'rate_limit',
          message:
            "You're sending messages too quickly. Please wait a moment before trying again.",
          recoveryAction: {
            label: 'Try Again',
            action: () => {
              // Clear this specific error and allow retry
              clearErrors()
            },
          },
          dismissible: true,
        })
      } else if (
        error.toLowerCase().includes('connection') ||
        error.toLowerCase().includes('network')
      ) {
        addError({
          type: 'connection_error',
          message:
            'Connection lost. Please check your internet connection and try again.',
          recoveryAction: {
            label: 'Retry Connection',
            action: () => {
              clearErrors()
              window.location.reload()
            },
          },
          dismissible: true,
        })
      } else {
        addError({
          type: 'stream_error',
          message:
            error ||
            'An unexpected error occurred while processing your message.',
          recoveryAction: {
            label: 'Try Again',
            action: () => clearErrors(),
          },
          dismissible: true,
        })
      }
    },
    [addError, clearErrors, router],
  )

  // Cancel session function
  const cancelSession = useCallback(async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Clear streaming state immediately
      setStreamingText('')
      setIsStreamingTokens(false)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      setStreamingAgent(null)
      streamingMessageIdRef.current = null
    } catch (error) {
      console.error('Failed to cancel session:', error)
      addError({
        type: 'generic',
        message: 'Failed to cancel the session. Please try again.',
        recoveryAction: {
          label: 'Try Again',
          action: () => clearErrors(),
        },
        dismissible: true,
      })
    }
  }, [sessionId, addError, clearErrors])

  // Set up streaming with error handling
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId,
    onToken: text => {
      setStreamingText(prev => prev + text)
      setIsStreamingTokens(true)
      setHasReceivedTokens(true)
    },
    onMessage: content => {
      // Message is complete - set final content and wait for websocket confirmation
      setStreamingText(content)
      setIsStreamingTokens(false) // Stop showing typing indicator
      setWaitingForWebSocket(true)
      streamingMessageIdRef.current = content

      // Fallback timeout in case websocket doesn't deliver
      setTimeout(() => {
        if (streamingMessageIdRef.current === content) {
          //setStreamingText('')
          //setIsStreamingTokens(false)
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          //setStreamingAgent(null)
          streamingMessageIdRef.current = null
        }
      }, 2000)
    },
    onToolComplete: () => {
      // After tool calls complete, we expect more tokens from the LLM
      // So set up streaming state for the follow-up response
      setStreamingText('')
      setIsStreamingTokens(true)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      // Keep the streaming agent for continuity
      streamingMessageIdRef.current = null

      // Fallback timeout in case no follow-up response comes
      setTimeout(() => {
        if (!hasReceivedTokens) {
          setStreamingText('')
          setIsStreamingTokens(false)
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          setStreamingAgent(null)
          streamingMessageIdRef.current = null
        }
      }, 3000)
    },
    onError: handleStreamingError,
    onDone: () => {
      // Only clear if we're not waiting for websocket
      if (!waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
        // Don't clear streamingAgent here - let the websocket effect handle it
      }
    },
    onAgentInfo: agent => {
      setStreamingAgent(agent)
    },
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  // Separate effect for streaming text to avoid double scroll
  useEffect(() => {
    if (streamingText && isStreamingTokens) {
      scrollToBottom()
    }
  }, [streamingText, isStreamingTokens, scrollToBottom])

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const filteredMessages = useMemo(
    () => session?.messages?.filter(m => m.role !== 'tool') ?? [],
    [session?.messages],
  )
  const messageGroups = useMemo(
    () => groupConsecutiveMessages(filteredMessages),
    [filteredMessages],
  )

  // Only show loading if we have no data at all and are actively loading
  if (isSessionLoading && !session) {
    return (
      <div className="flex mx-auto py-16">
        <LoadingIndicator />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
        <AlertDestructive>
          <AlertDescription>
            We couldn't load this session. Please try again later. If the
            problem persists, please contact support.
          </AlertDescription>
        </AlertDestructive>
      </div>
    )
  }

  return (
    <>
      {/* Sticky top bar showing agents */}
      {session?.agents && session.agents.length > 0 && (
        <SessionTopBar
          agents={session.agents}
          title={session.title}
          sessionBudget={session.budget}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
        {messageGroups.map(group => (
          <div key={group[0]._id}>
            {group[0].role === 'eden'
              ? group.map(message => (
                  <EdenMessage key={message._id} message={message} />
                ))
              : isOwnMessage(group[0].sender?._id)
              ? group.map(message => (
                  <UserMessage key={message._id} message={message} />
                ))
              : group
                  .filter(message => message.role !== 'tool')
                  .map((message, index) => (
                    <OtherMessage
                      sessionId={sessionId as string}
                      key={message._id}
                      message={message}
                      showAvatar={index === 0}
                    />
                  ))}
          </div>
        ))}

        {/* Show streaming message when actively streaming tokens or waiting for websocket */}
        {(isStreamingTokens ||
          waitingForWebSocket ||
          streamingText.length > 0) && (
          <div className="mb-4">
            <OtherMessage
              sessionId={sessionId as string}
              message={
                {
                  _id: 'streaming',
                  content: streamingText,
                  sender: streamingAgent ||
                    session?.agents?.[0] || {
                      _id: 'agent',
                      username: 'Assistant',
                    },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  session: sessionId,
                  role: 'assistant',
                } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              }
              showAvatar={true}
              isStreamingTokens={isStreamingTokens && !hasReceivedTokens}
            />
          </div>
        )}
        {/* Error Display */}
        <ErrorDisplay
          errors={errors}
          onDismiss={removeError}
          className="mb-4"
        />

        <div ref={messagesEndRef} />
      </div>

      <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
        <MessageInput
          sessionId={sessionId as string}
          onStreamingMessage={(content, attachments) => {
            // Clear any existing errors when starting a new message
            clearErrors()

            setIsStreamingTokens(true)
            setHasReceivedTokens(false)
            setStreamingText('')
            setStreamingAgent(null)
            sendStreamingMessage(content, attachments)
            // Scroll to bottom when streaming starts
            setTimeout(scrollToBottom, 100)
          }}
          onCancel={cancelSession}
          isStreaming={
            isStreamingTokens || waitingForWebSocket || streamingText.length > 0
          }
        />
      </div>
    </>
  )
}

export default Session
