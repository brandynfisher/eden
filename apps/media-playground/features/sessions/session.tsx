'use client'

import { ErrorDisplay } from './components/error-display'
import { MessageInput } from './components/message-input'
import { NonStreamingMessageDisplay } from './components/non-streaming-message-display'
import SessionWelcome from './components/session-welcome'
import { StreamingMessageDisplay } from './components/streaming-message-display'
import { useNonStreamingState } from './hooks/use-non-streaming-state'
import { useStreamingState } from './hooks/use-streaming-state'
import NewSession from './new-session'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { sessionConfig } from '@/lib/config'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Session = ({
  optimisticSessionId,
}: { optimisticSessionId?: string } = {}) => {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const sessionId = optimisticSessionId || (params?.id as string)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthState()
  const ischatRoute = pathname?.startsWith('/chat')
  const [cancelledNotice, setCancelledNotice] = useState(false)
  
  // Track the current session ID for live audio (handles session creation)
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId)
  
  // Update currentSessionId when sessionId prop changes
  useEffect(() => {
    setCurrentSessionId(sessionId)
  }, [sessionId])

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

  // State management for streaming and non-streaming modes
  const streamingState = useStreamingState({
    sessionId: currentSessionId,
    enabled: sessionConfig.useStreaming,
    onError: (error: string) => handleError(error),
    setOptimisticMessages: setter => {
      if (sessionConfig.useStreaming) {
        streamingOptimisticMessages.current =
          typeof setter === 'function'
            ? setter(streamingOptimisticMessages.current)
            : setter
      }
    },
    onSessionCreated: (newSessionId: string) => {
      console.log('🎤 [SESSION] Session created, updating currentSessionId:', newSessionId)
      setCurrentSessionId(newSessionId)
      // Also navigate to the new session URL to keep URL in sync
      if (ischatRoute && params?.agentId) {
        router.replace(`/chat/${params.agentId}/${newSessionId}`)
      } else {
        router.replace(`/sessions/${newSessionId}`)
      }
    },
  })

  const nonStreamingState = useNonStreamingState({
    sessionId,
    session,
    enabled: !sessionConfig.useStreaming,
    onError: (error: string) => handleError(error),
    user,
  })

  // Unified optimistic messages state
  const streamingOptimisticMessages = useRef<Message[]>([])
  const optimisticMessages = sessionConfig.useStreaming
    ? streamingOptimisticMessages.current
    : nonStreamingState.optimisticMessages

  // Error handling function
  const handleError = useCallback(
    (error: string) => {
      console.error('Error:', error)

      // Clear appropriate state based on mode
      if (sessionConfig.useStreaming) {
        streamingState.clearStreamingState()
      } else {
        nonStreamingState.clearNonStreamingState()
      }

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
    [addError, clearErrors, router, streamingState, nonStreamingState],
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

      // Clear appropriate state based on mode
      if (sessionConfig.useStreaming) {
        streamingState.clearStreamingState()
      } else {
        nonStreamingState.clearNonStreamingState()
      }

      setCancelledNotice(true)
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
  }, [sessionId, addError, clearErrors, streamingState, nonStreamingState])

  // Determine which agent should be responding based on session data
  const getRespondingAgent = useCallback(() => {
    const currentStreamingAgent = sessionConfig.useStreaming
      ? streamingState.streamingAgent
      : null

    // Use streamingAgent if available (from stream) - but enrich it if incomplete
    if (currentStreamingAgent) {
      // If streaming agent is missing userImage, try to enrich from session data
      if (!currentStreamingAgent.userImage) {
        const enrichedAgent =
          session?.agents && session.agents.length > 0
            ? session.agents[0]
            : null
        if (enrichedAgent && enrichedAgent.userImage) {
          return {
            ...currentStreamingAgent,
            userImage: enrichedAgent.userImage.startsWith('https://')
              ? enrichedAgent.userImage
              : getCloudfrontUrl(enrichedAgent.userImage),
            name: currentStreamingAgent.name || enrichedAgent.name,
          }
        }
      }
      return currentStreamingAgent
    }

    // Otherwise use the first agent from the session (which has complete data)
    if (session?.agents && session.agents.length > 0) {
      const sessionAgent = session.agents[0]
      return {
        _id: sessionAgent._id,
        username: sessionAgent.username,
        name: sessionAgent.name,
        userImage: sessionAgent.userImage?.startsWith('https://')
          ? sessionAgent.userImage
          : getCloudfrontUrl(sessionAgent.userImage),
      }
    }

    // Final fallback
    return {
      _id: 'agent',
      username: 'Assistant',
      name: 'Assistant',
    }
  }, [streamingState.streamingAgent, session?.agents])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages, scrollToBottom])

  // Separate effect for streaming text to avoid double scroll
  useEffect(() => {
    if (
      sessionConfig.useStreaming &&
      streamingState.streamingText &&
      streamingState.isStreamingTokens
    ) {
      scrollToBottom()
    }
  }, [
    streamingState.streamingText,
    streamingState.isStreamingTokens,
    scrollToBottom,
  ])

  const isOwnMessage = (senderId?: string) => {
    if (!senderId) return false
    return user?._id === senderId
  }

  // Parse mentions from message content
  const parseMentions = useCallback((content: string): string[] => {
    const mentionRegex = /@(\S+)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }
    
    return mentions
  }, [])

  // Get agent IDs from mentions
  const getAgentIdsFromMentions = useCallback((mentions: string[]): string[] => {
    if (!session?.agents) return []
    
    const agentIds: string[] = []
    
    for (const mention of mentions) {
      if (mention === 'agent') {
        // @agent means all agents
        return session.agents.map(agent => agent._id)
      } else {
        // Find specific agent by username
        const agent = session.agents.find(a => a.username === mention)
        if (agent) {
          agentIds.push(agent._id)
        }
      }
    }
    
    return agentIds
  }, [session?.agents])

  // Get responding agents based on mentions
  const getRespondingAgents = useCallback((agentIds: string[]): Array<{
    _id: string
    username: string
    name: string
    userImage?: string
  }> => {
    if (!session?.agents || agentIds.length === 0) {
      // Only fallback to first agent in single-agent sessions
      // In multi-agent sessions, no mentions = no loaders
      if (session?.agents && session.agents.length === 1) {
        const agent = session.agents[0]
        return [{
          _id: agent._id,
          username: agent.username,
          name: agent.name,
          userImage: agent.userImage?.startsWith('https://')
            ? agent.userImage
            : getCloudfrontUrl(agent.userImage),
        }]
      }
      return []
    }

    return agentIds.map(agentId => {
      const agent = session!.agents.find(a => a._id === agentId)
      if (agent) {
        return {
          _id: agent._id,
          username: agent.username,
          name: agent.name,
          userImage: agent.userImage?.startsWith('https://')
            ? agent.userImage
            : getCloudfrontUrl(agent.userImage),
        }
      }
      return {
        _id: agentId,
        username: 'Unknown',
        name: 'Unknown Agent',
      }
    })
  }, [session])

  const filteredMessages = useMemo(() => {
    const existingMessages =
      session?.messages?.filter(
        m =>
          (m.role === 'user' || m.role === 'assistant' || m.role === 'eden') &&
          ((m.content && m.content.trim() !== '') ||
            (m.role === 'assistant' &&
              m.tool_calls &&
              m.tool_calls.length > 0) ||
            (m.role === 'eden' && m.eden_message_data)) &&
          // Filter out eden messages with agent_add and agent_remove types in chat routes
          !(
            ischatRoute &&
            m.role === 'eden' &&
            m.eden_message_data &&
            (m.eden_message_data.message_type === 'agent_add' ||
              m.eden_message_data.message_type === 'agent_remove')
          ),
      ) ?? []

    if (sessionId === 'new' && isSessionLoading) {
      return [...existingMessages, ...optimisticMessages]
    }

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
  }, [
    session?.messages,
    sessionId,
    isSessionLoading,
    optimisticMessages,
    ischatRoute,
  ])

  const messageGroups = useMemo(
    () => groupConsecutiveMessages(filteredMessages),
    [filteredMessages],
  )

  const MessageSkeleton = () => (
    <div className="mb-4 flex space-x-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )

  // If sessionId is 'new', render the NewSession component
  if (sessionId === 'new') {
    return <NewSession />
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

  // Only show the main loading indicator if we're not coming from a direct navigation
  // (i.e., when sessionId is 'new' or when explicitly loading a session from scratch)
  if (isSessionLoading && !session && sessionId === 'new') {
    return (
      <div className="flex mx-auto py-16">
        <LoadingIndicator />
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex-1 pb-4',
          messageGroups.length === 0 &&
            'flex flex-col justify-center items-center',
        )}
      >
        <div className="p-4 pb-8 max-w-[--aui-thread-max-width] mx-auto w-full">
          {/* Only show loading skeleton if we are on a new session */}
          {sessionId === 'new' && isSessionLoading ? (
            <div className="space-y-4">
              <MessageSkeleton />
              <MessageSkeleton />
            </div>
          ) : sessionError ? (
            <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
              <AlertDestructive>
                <AlertDescription>
                  We couldn't load this session. Please try again later. If the
                  problem persists, please contact support.
                </AlertDescription>
              </AlertDestructive>
            </div>
          ) : (
            (() => {
              // Check if this is a newly created session waiting for first response
              const isNewSession =
                session &&
                new Date().getTime() - new Date(session.createdAt).getTime() <
                  30000 // Created within 30 seconds
              // Check if we have only user messages (no assistant responses yet)
              // Ignore system/eden messages when checking
              const userMessages =
                session?.messages?.filter(m => m.role === 'user') || []
              const assistantMessages =
                session?.messages?.filter(m => m.role === 'assistant') || []
              const hasOnlyUserMessage =
                userMessages.length > 0 && assistantMessages.length === 0
              const isWaitingForFirstResponse =
                isNewSession && hasOnlyUserMessage

              if (isWaitingForFirstResponse) {
                // Parse mentions from the last user message to determine if we should show loader
                const lastUserMessage = userMessages[userMessages.length - 1]
                const mentions = lastUserMessage?.content ? parseMentions(lastUserMessage.content) : []
                const mentionedAgentIds = getAgentIdsFromMentions(mentions)
                const shouldShowLoader = session?.agents && session.agents.length === 1 || mentionedAgentIds.length > 0

                return (
                  <>
                    {/* Show existing messages */}
                    {messageGroups.map(group => (
                      <div key={group[0]._id}>
                        {group[0].role === 'eden'
                          ? group.map(message => (
                              <EdenMessage
                                key={message._id}
                                message={message}
                              />
                            ))
                          : isOwnMessage(group[0].sender?._id)
                          ? group.map(message => (
                              <UserMessage
                                key={message._id}
                                message={message}
                                session={session}
                              />
                            ))
                          : group
                              .filter(message => message.role !== 'tool')
                              .map(message => (
                                <OtherMessage
                                  sessionId={sessionId as string}
                                  key={message._id}
                                  message={message}
                                  showAvatar={true}
                                />
                              ))}
                      </div>
                    ))}

                    {/* Show agent typing indicator only if appropriate */}
                    {shouldShowLoader && (
                      <div className="mb-4">
                        <OtherMessage
                          sessionId={sessionId as string}
                          message={
                            {
                              _id: 'loading-first-response',
                              content: '',
                              sender: mentionedAgentIds.length > 0 
                                ? getRespondingAgents(mentionedAgentIds)[0] || getRespondingAgent()
                                : getRespondingAgent(),
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              session: sessionId,
                              role: 'assistant',
                            } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                          }
                          showAvatar={true}
                          isStreamingTokens={true} // This will show the typing indicator
                        />
                      </div>
                    )}
                  </>
                )
              }

              // If messageGroups is empty, handle empty state
              if (messageGroups.length === 0) {
                // If we have explicit waiting states, show loading
                if (
                  !sessionConfig.useStreaming &&
                  nonStreamingState.waitingForResponse &&
                  ((session?.messages && session.messages.length > 0) || session?.title)
                ) {
                  return (
                    <div className="mb-4">
                      <OtherMessage
                        sessionId={sessionId as string}
                        message={
                          {
                            _id: 'loading-non-streaming',
                            content: '',
                            sender: getRespondingAgent(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            session: sessionId,
                            role: 'assistant',
                          } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                        }
                        showAvatar={true}
                        isStreamingTokens={true} // This will show the typing indicator
                      />
                    </div>
                  )
                }

                if (
                  sessionConfig.useStreaming &&
                  (streamingState.isStreamingTokens ||
                    streamingState.waitingForWebSocket) &&
                  ((session?.messages && session.messages.length > 0) || session?.title)
                ) {
                  return (
                    <div className="mb-4">
                      <OtherMessage
                        sessionId={sessionId as string}
                        message={
                          {
                            _id: 'loading-streaming',
                            content: streamingState.streamingText || '',
                            sender: getRespondingAgent(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            session: sessionId,
                            role: 'assistant',
                          } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                        }
                        showAvatar={true}
                        isStreamingTokens={
                          streamingState.isStreamingTokens &&
                          !streamingState.hasReceivedTokens
                        }
                      />
                    </div>
                  )
                }

                // Otherwise show welcome screen
                return session?.agents && session.agents.length > 0 ? (
                  <>
                    <SessionWelcome
                      variant="session"
                      agents={session.agents}
                      sessionTitle={session.title}
                    />
                  </>
                ) : null
              }

              // Normal case - show messages
              return (
                <>
                  {messageGroups.map(group => (
                    <div key={group[0]._id}>
                      {group[0].role === 'eden'
                        ? group.map(message => (
                            <EdenMessage key={message._id} message={message} />
                          ))
                        : isOwnMessage(group[0].sender?._id)
                        ? group.map(message => (
                            <UserMessage key={message._id} message={message} session={session} />
                          ))
                        : group
                            .filter(message => message.role !== 'tool')
                            .map(message => (
                              <OtherMessage
                                sessionId={sessionId as string}
                                key={message._id}
                                message={message}
                                showAvatar={true}
                              />
                            ))}
                    </div>
                  ))}
                </>
              )
            })()
          )}

          {/* Streaming message display */}
          {sessionConfig.useStreaming && (
            <StreamingMessageDisplay
              sessionId={sessionId as string}
              isStreamingTokens={streamingState.isStreamingTokens}
              waitingForWebSocket={streamingState.waitingForWebSocket}
              streamingText={streamingState.streamingText}
              hasReceivedTokens={streamingState.hasReceivedTokens}
              streamingAgent={streamingState.streamingAgent}
              getRespondingAgent={getRespondingAgent}
              filteredMessages={filteredMessages}
              streamingMessageIdRef={streamingState.streamingMessageIdRef}
              onStreamingComplete={streamingState.clearStreamingState}
            />
          )}

          {/* Non-streaming loading indicator */}
          {!sessionConfig.useStreaming && (
            <NonStreamingMessageDisplay
              sessionId={sessionId as string}
              waitingForResponse={nonStreamingState.waitingForResponse}
              getRespondingAgents={() => {
                // Get agents from stored agent IDs
                return getRespondingAgents(nonStreamingState.respondingAgentIds || [])
              }}
            />
          )}

          {/* Error Display */}
          <ErrorDisplay
            errors={errors}
            onDismiss={removeError}
            className="mb-4"
          />
          {cancelledNotice && (
            <div className="text-center text-sm text-muted-foreground py-2">
              ⛔ Cancelled by user
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-aui-background p-4 z-10">
        <div className="max-w-[--aui-thread-max-width] mx-auto w-full">
          <MessageInput
            sessionId={currentSessionId as string}
            enableLiveAudio={true}
            onStreamingMessage={(content, attachments) => {
              clearErrors()
              setCancelledNotice(false)

              // Parse mentions to get agent IDs
              const mentions = parseMentions(content)
              let agentIds = getAgentIdsFromMentions(mentions)
              
              // If no agent IDs and it's a single agent session, use the single agent
              if (agentIds.length === 0 && session?.agents && session.agents.length === 1) {
                agentIds = [session.agents[0]._id]
              }
              
              // For multi-agent sessions with no mentions, agentIds will remain empty array
              // This will still create the user message but won't trigger any agent responses

              if (sessionConfig.useStreaming) {
                streamingState.initializeStreaming()
                streamingState.sendMessage(content, attachments)

                // Add optimistic messages
                streamingOptimisticMessages.current = [
                  ...streamingOptimisticMessages.current,
                  {
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
                    session: sessionId,
                    role: 'user',
                  } as Message,
                  {
                    _id: `optimistic-agent-${Date.now()}`,
                    content: '',
                    sender: getRespondingAgent(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    session: sessionId,
                    role: 'assistant',
                    __optimistic: true,
                  } as Message,
                ]

                setTimeout(scrollToBottom, 100)
              } else {
                nonStreamingState.setWaitingForResponse(true)

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
                  session: sessionId,
                  role: 'user',
                  attachments: attachments || [],
                } as Message

                nonStreamingState.setOptimisticMessages(prev => [
                  ...prev,
                  userMessage,
                ])
                
                // Pass agent_ids in options
                nonStreamingState.sendMessage(content, attachments, { agent_ids: agentIds })
                setTimeout(scrollToBottom, 100)
              }
            }}
            onCancel={cancelSession}
            isStreaming={
              sessionConfig.useStreaming
                ? streamingState.isStreamingTokens ||
                  streamingState.waitingForWebSocket ||
                  streamingState.streamingText.length > 0
                : nonStreamingState.waitingForResponse
            }
          />
        </div>
      </div>
    </>
  )
}

export default Session
