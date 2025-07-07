'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import SingleAgentSelectorModal from '@/features/chat/components/single-agent-selector-modal'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { ErrorDisplay } from '@/features/sessions/components/error-display'
import { MessageInput } from '@/features/sessions/components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SessionTopBar } from '@/features/sessions/components/session-top-bar'
import SessionWelcome from '@/features/sessions/components/session-welcome'
import { UserMessage } from '@/features/sessions/components/user-message'
import Session from '@/features/sessions/session'
import { groupConsecutiveMessages } from '@/features/sessions/utils/group-messages'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { sessionConfig } from '@/lib/config'
import { getCloudfrontUrl } from '@/lib/media'
import { Agent, Message } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SessionChat: FC = () => {
  const agentId = useParams()?.agentId as string | undefined
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

  // Non-streaming mode states
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])

  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)

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

  // Determine which agent should be responding based on session data
  // This avoids waiting for the stream to tell us and uses data we already have
  const getRespondingAgent = useCallback(() => {
    // Use streamingAgent if available (from stream) - but enrich it if incomplete
    if (streamingAgent) {
      // If streaming agent is missing userImage, try to enrich from session or route agent
      if (!streamingAgent.userImage) {
        const enrichedAgent =
          agent ||
          (session?.agents && session.agents.length > 0
            ? session.agents[0]
            : null)
        if (enrichedAgent && enrichedAgent.userImage) {
          return {
            ...streamingAgent,
            userImage: enrichedAgent.userImage.startsWith('https://')
              ? enrichedAgent.userImage // Already a URL, don't process
              : getCloudfrontUrl(enrichedAgent.userImage), // Convert filename to URL
            name: streamingAgent.name || enrichedAgent.name,
          }
        }
      }
      return streamingAgent
    }

    // For new chats, prioritize the agent from query (always available from route)
    if (agent) {
      return {
        _id: agent._id,
        username: agent.username,
        name: agent.name,
        userImage: agent.userImage?.startsWith('https://')
          ? agent.userImage // Already a URL, don't process
          : getCloudfrontUrl(agent.userImage), // Convert filename to URL
      }
    }

    // For existing sessions, use the agent from session data
    if (session?.agents && session.agents.length > 0) {
      const sessionAgent = session.agents[0]
      return {
        _id: sessionAgent._id,
        username: sessionAgent.username,
        name: sessionAgent.name,
        userImage: sessionAgent.userImage?.startsWith('https://')
          ? sessionAgent.userImage // Already a URL, don't process
          : getCloudfrontUrl(sessionAgent.userImage), // Convert filename to URL
      }
    }

    // Final fallback
    return {
      _id: 'agent',
      username: 'Assistant',
      name: 'Assistant',
    }
  }, [streamingAgent, agent, session?.agents])

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
  }, [])

  // Clear streaming state when websocket delivers the real message (streaming mode)
  useEffect(() => {
    if (
      sessionConfig.useStreaming &&
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

  // Clear waiting state when websocket delivers response (non-streaming mode)
  useEffect(() => {
    if (
      !sessionConfig.useStreaming &&
      waitingForResponse &&
      session?.messages
    ) {
      const lastMessage = session.messages[session.messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        setWaitingForResponse(false)
        setOptimisticMessages([])

        // Check if we should redirect now that response is complete
        if (pendingRedirect && session?.title) {
          queryClient.setQueryData(['session', pendingRedirect.sessionId], {
            ...session,
            _id: pendingRedirect.sessionId,
          })

          router.replace(
            `/chat2/${pendingRedirect.agentId}/${pendingRedirect.sessionId}`,
          )
          setPendingRedirect(null)
        }
      }
    }
  }, [
    session?.messages,
    waitingForResponse,
    pendingRedirect,
    router,
    queryClient,
  ])

  // Clear optimistic messages when real messages arrive (non-streaming mode)
  useEffect(() => {
    if (
      !sessionConfig.useStreaming &&
      session?.messages &&
      optimisticMessages.length > 0
    ) {
      // Check if we have real messages that match our optimistic ones
      const hasRealUserMessage = session.messages.some(
        msg =>
          msg.role === 'user' &&
          optimisticMessages.some(
            opt =>
              opt.role === 'user' &&
              opt.content === msg.content &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(opt.createdAt).getTime(),
              ) < 10000, // Within 10 seconds
          ),
      )

      if (hasRealUserMessage) {
        // Remove optimistic user messages that have real counterparts
        setOptimisticMessages(prev =>
          prev.filter(
            opt =>
              !(
                opt.role === 'user' &&
                session.messages.some(
                  real =>
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
  }, [session?.messages, optimisticMessages])

  // Add this effect to invalidate sessions list when the session title changes
  useEffect(() => {
    if (session?.title && sessionId) {
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

  // Replace the multiple redirect effects with a single, more reliable one (streaming mode)
  useEffect(() => {
    if (!sessionConfig.useStreaming || !pendingRedirect) return

    const streamingComplete =
      !isStreamingTokens && !waitingForWebSocket && streamingText.length === 0

    if (session?.title && streamingComplete) {
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

      // Clear non-streaming state
      setWaitingForResponse(false)
      setOptimisticMessages([])

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

  // Set up streaming - use optimistic session ID if available (only for streaming mode)
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId: sessionConfig.useStreaming
      ? sessionId || optimisticSessionId || undefined
      : undefined,
    onToken: text => {
      if (sessionConfig.useStreaming) {
        setStreamingText(prev => prev + text)
        setIsStreamingTokens(true)
        setHasReceivedTokens(true)
      }
    },
    onMessage: content => {
      if (sessionConfig.useStreaming) {
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
        }, 100) // Reduced from 2000ms to 100ms
      }
    },
    onToolComplete: () => {
      if (sessionConfig.useStreaming) {
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
      }
    },
    onError: handleStreamingError,
    onDone: () => {
      if (sessionConfig.useStreaming && !waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
      }
    },
    onAgentInfo: agent => {
      if (sessionConfig.useStreaming) {
        setStreamingAgent(agent)
      }
    },
    onSessionCreated: newSessionId => {
      setSessionId(newSessionId)

      const currentOptimisticId = optimisticSessionIdRef.current
      if (currentOptimisticId) {
        // Copy any cached data from optimistic session to real session
        const optimisticData = queryClient.getQueryData([
          'session',
          currentOptimisticId,
        ])
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

        router.push(`/chat2/${agentId}/${newSessionId}`)
      } else {
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

  // Non-streaming message sending function
  const sendNonStreamingMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!user || !agent) return

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
            agent_ids: sessionId ? undefined : [agent._id],
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        // If this is a new session, the response should contain session_id
        if (!sessionId) {
          const result = await response.json()
          if (result.session_id) {
            setSessionId(result.session_id)
            setPendingRedirect({
              agentId: agentId as string,
              sessionId: result.session_id,
            })
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        handleStreamingError('Failed to send message')
        setWaitingForResponse(false)
        setOptimisticMessages([])
      }
    },
    [user, agent, sessionId, agentId, handleStreamingError],
  )

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!user || !agent) return
      clearErrors()

      if (sessionConfig.useStreaming) {
        // Streaming mode - existing logic
        setIsStreamingTokens(true)

        if (!sessionId && !optimisticSessionId) {
          const tempSessionId = `temp-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`
          setOptimisticSessionId(tempSessionId)
          optimisticSessionIdRef.current = tempSessionId
          // Create optimistic session without user message - let streaming handle the display
          const optimisticSessionData = {
            _id: tempSessionId,
            agents: [agent],
            messages: [],
            title: null,
            budget: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          queryClient.setQueryData(
            ['session', tempSessionId],
            optimisticSessionData,
          )

          // Start streaming to the optimistic session
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
      } else {
        // Non-streaming mode - show user message immediately and wait for websocket
        setWaitingForResponse(true)

        // Add optimistic user message
        const userMessage: Message = {
          _id: `optimistic-user-${Date.now()}`,
          content: content,
          sender: {
            _id: user?._id || 'user',
            username: user?.username || 'User',
            name: user?.username || 'You',
            userImage: user?.userImage,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          session: sessionId || 'new',
          role: 'user',
          attachments: attachments || [],
        } as Message

        setOptimisticMessages(prev => [...prev, userMessage])

        // Send the message
        await sendNonStreamingMessage(content, attachments)

        // Scroll to bottom
        setTimeout(scrollToBottom, 100)
      }
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
      sendNonStreamingMessage,
    ],
  )

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  const filteredMessages = useMemo(() => {
    const existingMessages =
      session?.messages?.filter(m => m.role !== 'tool') ?? []

    // In non-streaming mode, include optimistic messages but avoid duplicates
    if (!sessionConfig.useStreaming) {
      // Filter out optimistic messages that have real counterparts
      const uniqueOptimisticMessages = optimisticMessages.filter(
        opt =>
          !existingMessages.some(
            real =>
              real.role === opt.role &&
              real.content === opt.content &&
              Math.abs(
                new Date(real.createdAt).getTime() -
                  new Date(opt.createdAt).getTime(),
              ) < 10000,
          ),
      )
      return [...existingMessages, ...uniqueOptimisticMessages]
    }

    return existingMessages
  }, [session?.messages, optimisticMessages])

  const messageGroups = useMemo(
    () => groupConsecutiveMessages(filteredMessages),
    [filteredMessages],
  )

  const handleAgentSelect = (selectedAgent: {
    _id: string
    username: string
    name: string
    userImage?: string
  }) => {
    // If selecting the same agent we're already on, just close the modal
    if (session?.agents?.[0]?.username === selectedAgent.username) {
      setIsAgentSelectorOpen(false)
      return
    }

    router.push(`/chat2/${selectedAgent.username}`)
    // Don't close modal immediately - it will close when navigation completes
  }

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

  // Show session error first to prevent infinite loading
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

  // If we have a session ID and messages, show the full session interface
  const hasSessionContent =
    sessionId &&
    (session?.messages?.length ||
      streamingText ||
      isStreamingTokens ||
      optimisticMessages.length > 0)

  // but keep streaming logic in this component
  if (optimisticSessionId) {
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
      {session?.agents && session.agents.length > 0 && (
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
            variant="chat"
            agent={agent as Agent}
            onSendMessage={handleSendMessage}
            isLoading={
              sessionConfig.useStreaming
                ? isStreamingTokens
                : waitingForResponse
            }
            onAgentSelectorOpen={() => setIsAgentSelectorOpen(true)}
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

            {/* Show streaming message when actively streaming tokens or waiting for websocket (streaming mode) */}
            {sessionConfig.useStreaming &&
              (isStreamingTokens ||
                waitingForWebSocket ||
                streamingText.length > 0) && (
                <div className="mb-4">
                  <OtherMessage
                    sessionId={sessionId as string}
                    message={
                      {
                        _id: 'streaming',
                        content: streamingText,
                        sender: getRespondingAgent(),
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

            {/* Show loading indicator when waiting for response (non-streaming mode) */}
            {!sessionConfig.useStreaming && waitingForResponse && (
              <div className="mb-4">
                <OtherMessage
                  sessionId={sessionId as string}
                  message={
                    {
                      _id: 'loading',
                      content: '',
                      sender: getRespondingAgent(),
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      session: sessionId,
                      role: 'assistant',
                    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                  }
                  showAvatar={true}
                  isStreamingTokens={true} // This will show the loading indicator
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
              sessionConfig.useStreaming
                ? isStreamingTokens ||
                  waitingForWebSocket ||
                  streamingText.length > 0
                : waitingForResponse
            }
          />
        </div>
      )}
      <SingleAgentSelectorModal
        open={isAgentSelectorOpen}
        onOpenChange={setIsAgentSelectorOpen}
        onSelect={handleAgentSelect}
      />
    </main>
  )
}

export default SessionChat
