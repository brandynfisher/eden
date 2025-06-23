'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { ErrorDisplay } from '@/features/sessions/components/error-display'
import { MessageInput } from '@/features/sessions/components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SessionTopBar } from '@/features/sessions/components/session-top-bar'
import { UserMessage } from '@/features/sessions/components/user-message'
import Session from '@/features/sessions/session'
import { groupConsecutiveMessages } from '@/features/sessions/utils/group-messages'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Session Welcome Component
const SessionWelcome: FC<{
  agent: Agent | null | undefined
  onSendMessage: (content: string, attachments?: string[]) => void
  isLoading: boolean
}> = ({ agent, onSendMessage, isLoading }) => {
  const suggestions = agent?.suggestions || []
  const [showAll, setShowAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(suggestions.length)

  const measureAndUpdate = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const containerWidth = welcomeCenter.clientWidth - 86 // Account for button width
    const items = Array.from(container.querySelectorAll('.suggestion-item'))

    let totalWidth = 0
    let count = items.length

    for (let i = 0; i < items.length; i++) {
      const itemWidth = items[i].getBoundingClientRect().width + 8 // Gap
      if (totalWidth + itemWidth > containerWidth) {
        count = Math.max(1, i)
        break
      }
      totalWidth += itemWidth
    }

    setVisibleCount(count)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const resizeObserver = new ResizeObserver(() => {
      if (!showAll) {
        measureAndUpdate()
      }
    })

    resizeObserver.observe(welcomeCenter)
    measureAndUpdate()

    return () => resizeObserver.disconnect()
  }, [showAll, suggestions.length, measureAndUpdate])

  return (
    <div className="aui-thread-welcome">
      <div className="aui-thread-welcome-center relative flex flex-col items-center justify-center min-h-full py-8 px-4 sm:px-6 lg:px-8">
        {agent && (
          <>
            <div className="relative flex flex-col items-center p-2 mt-8">
              {/* Subtle glow effect behind avatar */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl scale-150 opacity-60 animate-pulse"></div>

              {/* Agent name with elegant typography */}
              <div className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 tracking-wide">
                {agent.name}
              </div>

              {/* Large, prominent avatar with beautiful border */}
              <div className="relative group mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/10 rounded-full scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
                <Avatar className="w-24 h-24 md:w-32 md:h-32 relative z-10 ring-4 ring-primary/25 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-primary/50 hover:scale-105">
                  <AvatarImage
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    src={getCloudfrontOriginalUrl(agent.userImage)}
                  />
                  <AvatarFallback
                    delayMs={250}
                    className="w-24 h-24 md:w-32 md:h-32 text-xl md:text-2xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary border-2 border-primary/20"
                  >
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="mb-8">
              <p className=" text-center">
                {agent.greeting || 'What do you want to create today?'}
              </p>
            </div>

            {/* Message Input for Welcome Screen */}
            <div className="w-full max-w-[--aui-thread-max-width] mx-auto mb-6">
              <MessageInput
                sessionId={'new'}
                onStreamingMessage={onSendMessage}
              />
            </div>
          </>
        )}

        {suggestions.length > 0 && (
          <div
            className="w-full max-w-[--aui-thread-max-width] mx-auto relative"
            ref={containerRef}
          >
            <div
              className={`flex flex-row gap-2 flex-wrap justify-center transition-[height,opacity] duration-200 ${
                !showAll ? 'overflow-hidden pr-[84px]' : 'flex-wrap'
              }`}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  className={`text-sm suggestion-item hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 transition-opacity duration-200 ${
                    !showAll && index >= visibleCount
                      ? 'opacity-0 absolute pointer-events-none'
                      : 'opacity-100'
                  }`}
                  key={`${suggestion.label}-${index}`}
                >
                  <button
                    className="px-3 py-2 rounded-full"
                    onClick={() => onSendMessage(suggestion.label)}
                    disabled={isLoading}
                  >
                    {suggestion.label}
                  </button>
                </div>
              ))}
            </div>
            {suggestions.length > visibleCount && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="absolute text-xs bg-muted/30 right-0 top-1/2 -translate-y-1/2 z-10 rounded-full"
                onClick={() => setShowAll(true)}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                More
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const SessionChat: FC = () => {
  const { agentId } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [optimisticSessionId, setOptimisticSessionId] = useState<string | null>(
    null,
  )
  const optimisticSessionIdRef = useRef<string | null>(null)
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

  // Add state to control when to redirect
  const [pendingRedirect, setPendingRedirect] = useState<{
    agentId: string
    sessionId: string
  } | null>(null)

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
    sessionId: sessionId || pendingRedirect?.sessionId || '',
    enabled: !!(sessionId || pendingRedirect?.sessionId),
  })

  // Only set up websockets if we have a sessionId
  useSessionWebSocket({
    sessionId: sessionId || pendingRedirect?.sessionId || '',
    enabled: !!(sessionId || pendingRedirect?.sessionId),
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

        // Check if we should redirect now that streaming is complete
        if (pendingRedirect && session?.title) {
          console.log(
            '***debug*** Redirecting after streaming complete with title:',
            session.title,
          )

          // Pre-populate the destination session cache with complete data
          queryClient.setQueryData(['session', pendingRedirect.sessionId], {
            ...session,
            _id: pendingRedirect.sessionId,
          })

          // Use replace instead of push for smoother transition
          router.replace(
            `/chat2/${pendingRedirect.agentId}/${pendingRedirect.sessionId}`,
          )
          setPendingRedirect(null)
        }
      }
    }
  }, [
    session?.messages,
    waitingForWebSocket,
    pendingRedirect,
    router,
    queryClient,
  ])

  // Add this effect to invalidate sessions list when the session title changes
  useEffect(() => {
    if (session?.title && sessionId) {
      console.log(
        '***debug*** Session title updated, invalidating sessions list:',
        session.title,
      )

      // Invalidate the sessions list so the sidebar updates with the new title
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list', agentId],
      })

      // Also invalidate the general sessions list
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list'],
      })
    }
  }, [session?.title, sessionId, queryClient, agentId])

  // Replace the multiple redirect effects with a single, more reliable one
  useEffect(() => {
    if (!pendingRedirect) return

    console.log('***debug*** Checking redirect conditions:', {
      pendingRedirect,
      hasTitle: !!session?.title,
      sessionTitle: session?.title,
      sessionId: session?._id,
      isStreamingTokens,
      waitingForWebSocket,
      streamingTextLength: streamingText.length,
      hasReceivedTokens,
      fullSession: session,
    })

    const streamingComplete =
      !isStreamingTokens && !waitingForWebSocket && streamingText.length === 0

    if (session?.title && streamingComplete) {
      console.log(
        '***debug*** Executing redirect to:',
        `/chat2/${pendingRedirect.agentId}/${pendingRedirect.sessionId}`,
      )

      // Pre-populate the destination session cache
      queryClient.setQueryData(['session', pendingRedirect.sessionId], {
        ...session,
        _id: pendingRedirect.sessionId,
      })

      // Invalidate sessions list before redirect to ensure sidebar updates
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list', agentId],
      })
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list'],
      })

      router.push(
        `/chat2/${pendingRedirect.agentId}/${pendingRedirect.sessionId}`,
      )
      setPendingRedirect(null)
    } else if (streamingComplete && pendingRedirect) {
      console.log(
        '***debug*** Streaming complete but no title, refetching session',
      )
      queryClient.invalidateQueries({
        queryKey: ['session', pendingRedirect.sessionId],
      })
    }
  }, [
    pendingRedirect,
    session?.title,
    session?._id,
    session, // Add full session as dependency
    isStreamingTokens,
    waitingForWebSocket,
    streamingText.length,
    hasReceivedTokens,
    router,
    queryClient,
    agentId, // Add agentId to dependencies
  ])

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

  // Set up streaming - use optimistic session ID if available
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId: sessionId || optimisticSessionId || undefined,
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

      // Shorter timeout and more reliable cleanup
      setTimeout(() => {
        if (streamingMessageIdRef.current === content) {
          setStreamingText('') // Clear streaming text
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          streamingMessageIdRef.current = null
        }
      }, 1000) // Reduced from 2000ms to 1000ms
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
      console.log(
        '***debug*** onSessionCreated called with:',
        newSessionId,
        'optimistic state:',
        optimisticSessionId,
        'optimistic ref:',
        optimisticSessionIdRef.current,
      )
      setSessionId(newSessionId)

      // ***debug*** If we were in optimistic mode, replace temp session with real session
      const currentOptimisticId = optimisticSessionIdRef.current
      if (currentOptimisticId) {
        console.log(
          '***debug*** Handling optimistic to real session transition',
        )
        // Copy any cached data from optimistic session to real session
        const optimisticData = queryClient.getQueryData([
          'session',
          currentOptimisticId,
        ])
        console.log('***debug*** Optimistic data:', optimisticData)
        if (optimisticData) {
          queryClient.setQueryData(['session', newSessionId], {
            ...optimisticData,
            _id: newSessionId,
          })
        }

        // Clear optimistic session
        queryClient.removeQueries({
          queryKey: ['session', currentOptimisticId],
        })
        setOptimisticSessionId(null)
        optimisticSessionIdRef.current = null

        // Instead of immediate redirect, set pending redirect
        console.log(
          '***debug*** Setting pending redirect instead of immediate navigation',
        )
        setPendingRedirect({
          agentId: agentId as string,
          sessionId: newSessionId,
        })
      } else {
        // ***debug*** Cache initial session data to avoid loading state on navigation
        // Pre-populate the cache with basic session data so session.tsx loads instantly
        if (agent && user) {
          const initialSessionData = {
            _id: newSessionId,
            agents: [agent],
            messages: [],
            title: null,
            budget: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          // Cache the initial session data so session.tsx can load instantly
          queryClient.setQueryData(
            ['session', newSessionId],
            initialSessionData,
          )
        }

        // Set pending redirect for non-optimistic case too
        console.log(
          '***debug*** Setting pending redirect for non-optimistic session',
        )
        setPendingRedirect({
          agentId: agentId as string,
          sessionId: newSessionId,
        })
      }

      // Fix: Use the correct query key structure to invalidate sessions list
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list', agentId],
      })

      // Also invalidate the general sessions list (without agent filter)
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'list'],
      })
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
      clearErrors()

      // If creating a new session optimistically:
      if (!sessionId && !optimisticSessionId) {
        const tempSessionId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`
        setOptimisticSessionId(tempSessionId)
        optimisticSessionIdRef.current = tempSessionId
        // Include an optimistic user message so "Session" won't show the welcome screen
        const optimisticSessionData = {
          _id: tempSessionId,
          agents: [agent],
          messages: [
            {
              _id: `tempMessage-${Date.now()}`,
              content,
              sender: { _id: user._id, username: user.username },
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          title: null,
          budget: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        queryClient.setQueryData(
          ['session', tempSessionId],
          optimisticSessionData,
        )

        // Start streaming
        setIsStreamingTokens(true)
        sendStreamingMessage(content, attachments, { agent_ids: [agent._id] })
        return
      }

      setIsStreamingTokens(true)
      setHasReceivedTokens(false)
      setStreamingText('')
      setStreamingAgent(null)

      // If we don't have a sessionId, we need to create one
      if (!sessionId) {
        sendStreamingMessage(content, attachments, {
          agent_ids: [agent._id],
        })
      } else {
        sendStreamingMessage(content, attachments)
      }

      // Scroll to bottom when streaming starts
      setTimeout(scrollToBottom, 100)
    },
    [
      user,
      agent,
      clearErrors,
      sendStreamingMessage,
      scrollToBottom,
      sessionId,
      optimisticSessionId,
      queryClient,
      setOptimisticSessionId,
    ],
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

  // ***debug*** IMMEDIATE optimistic rendering - if we have optimistic session, render Session component
  // but keep streaming logic in this component
  if (optimisticSessionId) {
    console.log(
      '***debug*** Rendering optimistic session component:',
      optimisticSessionId,
    )
    return (
      <>
        <Session optimisticSessionId={optimisticSessionId} />
        {/* Keep streaming logic active but hidden */}
        <div style={{ display: 'none' }}>
          {isStreamingTokens && 'Streaming active in background'}
        </div>
      </>
    )
  }

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
      {hasSessionContent && (
        <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-4">
          <MessageInput
            sessionId={sessionId || 'new'}
            onStreamingMessage={handleSendMessage}
            isStreaming={
              isStreamingTokens ||
              waitingForWebSocket ||
              streamingText.length > 0
            }
          />
        </div>
      )}
    </main>
  )
}

export default SessionChat
