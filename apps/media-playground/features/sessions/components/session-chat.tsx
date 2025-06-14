'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { ErrorDisplay } from '@/features/sessions/components/error-display'
import { MessageInput } from '@/features/sessions/components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SessionTopBar } from '@/features/sessions/components/session-top-bar'
import { UserMessage } from '@/features/sessions/components/user-message'
import { groupConsecutiveMessages } from '@/features/sessions/utils/group-messages'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { useParams } from 'next/navigation'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Session Welcome Component
const SessionWelcome: FC<{
  agent: Agent | null | undefined
  onSendMessage: (content: string, attachments?: string[]) => void
  isLoading: boolean
}> = ({ agent, onSendMessage, isLoading }) => {
  const suggestions = agent?.suggestions || []

  return (
    <div className="aui-thread-welcome">
      <div className="aui-thread-welcome-center relative flex flex-col items-center justify-center min-h-full py-8">
        {agent && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {agent.name}
            </div>
            <div className="w-16 h-16 md:w-24 md:h-24 mb-4">
              <img
                src={getCloudfrontOriginalUrl(agent.userImage)}
                alt={agent.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </>
        )}

        <div className="mb-8">
          {agent && (
            <p className="text-lg text-center">
              {agent.greeting || 'What do you want to create today?'}
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex flex-row gap-2 flex-wrap justify-center">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className="text-sm hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 px-3 py-2"
                  onClick={() => onSendMessage(suggestion.label)}
                  disabled={isLoading}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SessionChat: FC = () => {
  const { agentId } = useParams()
  const [isMounted, setIsMounted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user } = useAuthState()
  const { errors, addError, removeError, clearErrors } = useSessionErrors()

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId as string })

  // Only fetch session data if we have a sessionId
  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId,
  })

  // Only set up websockets if we have a sessionId
  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !!sessionId,
  })

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
  }, [])

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

      // Add appropriate error
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
    },
    [addError, clearErrors],
  )

  // Set up streaming
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId: sessionId || undefined,
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
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          streamingMessageIdRef.current = null
        }
      }, 2000)
    },
    onToolComplete: () => {
      // After tool calls complete, we expect more tokens from the LLM
      setStreamingText('')
      setIsStreamingTokens(true)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
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
      if (!waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
      }
    },
    onAgentInfo: agent => {
      setStreamingAgent(agent)
    },
    onSessionCreated: newSessionId => {
      setSessionId(newSessionId)
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

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!user || !agent) return

      // Clear any existing errors when starting a new message
      clearErrors()

      setIsStreamingTokens(true)
      setHasReceivedTokens(false)
      setStreamingText('')
      setStreamingAgent(null)

      // If we don't have a sessionId, we need to create one
      if (!sessionId) {
        sendStreamingMessage(content, attachments, {
          agent_ids: [agent._id],
          title: `Chat with ${agent.name}`,
        })
      } else {
        sendStreamingMessage(content, attachments)
      }

      // Scroll to bottom when streaming starts
      setTimeout(scrollToBottom, 100)
    },
    [user, agent, clearErrors, sendStreamingMessage, scrollToBottom, sessionId],
  )

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

  if (!isMounted) {
    return null
  }

  // Show loading if we're waiting for agent data
  if (!agent && !agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <LoadingIndicator className="w-10 h-10 text-purple-600" />
        </div>
      </main>
    )
  }

  // Show agent error
  if (agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4">
          <AlertDestructive title="Error loading agent">
            <AlertDescription>{agentErrorDetails?.message}</AlertDescription>
          </AlertDestructive>
        </div>
      </main>
    )
  }

  // Show session loading if we have a sessionId but session is still loading
  if (sessionId && isSessionLoading) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex mx-auto py-16">
          <LoadingIndicator />
        </div>
      </main>
    )
  }

  // Show session error
  if (sessionError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
          <AlertDestructive>
            <AlertDescription>
              We couldn't load this session. Please try again later. If the
              problem persists, please contact support.
            </AlertDescription>
          </AlertDestructive>
        </div>
      </main>
    )
  }

  // If we have a session ID and messages, show the full session interface
  const hasSessionContent =
    sessionId &&
    (session?.messages?.length || streamingText || isStreamingTokens)

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      {/* Sticky top bar showing agents - only show if we have session content */}
      {hasSessionContent && session?.agents && session.agents.length > 0 && (
        <SessionTopBar
          agents={session.agents}
          title={session.title}
          sessionBudget={session.budget}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
        {!hasSessionContent ? (
          // Show welcome screen if no session content yet
          <SessionWelcome
            agent={agent}
            onSendMessage={handleSendMessage}
            isLoading={isStreamingTokens}
          />
        ) : (
          // Show messages once we have session content
          <>
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
          </>
        )}

        {/* Error Display */}
        <ErrorDisplay
          errors={errors}
          onDismiss={removeError}
          className="mb-4"
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
        <MessageInput
          sessionId={sessionId || 'new'}
          onStreamingMessage={handleSendMessage}
        />
      </div>
    </main>
  )
}

export default SessionChat
