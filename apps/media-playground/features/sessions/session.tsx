'use client'

import { AgentAvatarsMenu } from './components/agent-avatars-menu'
import { ErrorDisplay } from './components/error-display'
import { MessageInput } from './components/message-input'
import { NonStreamingMessageDisplay } from './components/non-streaming-message-display'
import {
  SessionSettings,
  SessionSettingsModal,
} from './components/session-settings-modal'
import { SessionShareButton } from './components/session-share-button'
import { SessionStatusToggle } from './components/session-status-toggle'
import SessionWelcome from './components/session-welcome'
import { useSessionsLayoutContext } from './context/sessions-layout-context'
import { useNonStreamingState } from './hooks/use-non-streaming-state'
import { useStreamingState } from './hooks/use-streaming-state'
import NewSession from './new-session'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { AssistantMessage } from '@/features/sessions/components/assistant-message'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { SystemMessage } from '@/features/sessions/components/system-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useUpdateUserPreferences } from '@/hooks/mutation/use-update-user-preferences'
import { useSessionNotificationsQuery } from '@/hooks/query/use-session-notifications-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionTracking } from '@/hooks/use-session-tracking'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { sessionConfig } from '@/lib/config'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent, Message, SessionType } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BrainIcon, EditIcon, MenuIcon, Settings } from 'lucide-react'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const Session = ({
  optimisticSessionId,
  pendingMessage,
  onSessionLoaded,
  onOpenSidebar,
}: {
  optimisticSessionId?: string
  pendingMessage?: {
    content: string
    attachments?: string[]
    agent: Agent
  }
  onSessionLoaded?: () => void
  onOpenSidebar?: () => void
} = {}) => {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sessionId = optimisticSessionId || (params?.id as string)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { user, isSignedIn } = useAuthState()
  const { isAllowed: isSessionSettingsAllowed } = useGatedResource(
    GatedResource.SessionSettings,
  )
  const { toast } = useToast()
  const ischatRoute = pathname?.startsWith('/chat')
  const [cancelledNotice, setCancelledNotice] = useState(false)
  const isPendingTransition = searchParams?.get('pending') === 'true'
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [hasTriggeredInitialScroll, setHasTriggeredInitialScroll] =
    useState(false)
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false)
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    type: 'natural',
    context: '',
    conductor_prompt: '',
    delay_interval: 0,
    mention_force_reply: false,
    manna_budget_unlimited: true,
    token_budget_unlimited: true,
    turn_budget_unlimited: true,
    exclude_memory: false,
  })
  const queryClient = useQueryClient()
  const { mutateAsync: updateUserPreferences } = useUpdateUserPreferences()
  const lastSyncedSessionIdRef = useRef<string | null>(null)

  // Track session viewing for notifications
  useSessionTracking(sessionId)

  // Get optimistic notification clearing function
  const { markSessionAsRead } = useSessionNotificationsQuery()

  // Connection state tracking
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  >('connecting')

  // Track the current session ID for live audio (handles session creation)
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId)

  // Update currentSessionId when sessionId prop changes
  useEffect(() => {
    setCurrentSessionId(sessionId)
  }, [sessionId])

  // Mark notifications as read when session is loaded (optimistic update)
  useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      markSessionAsRead(sessionId).catch(err =>
        console.error('Failed to mark notifications as read:', err),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Mark notifications as read when page regains focus (optimistic update)
  useEffect(() => {
    if (!sessionId || sessionId === 'new') return

    const handleFocus = () => {
      markSessionAsRead(sessionId).catch(err =>
        console.error('Failed to mark notifications as read on focus:', err),
      )
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Error handling
  const { errors, addError, removeError, clearErrors } = useSessionErrors()

  // Use WebSocket for non-streaming mode
  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !sessionConfig.useStreaming && !!sessionId && sessionId !== 'new',
  })

  // Track which agents are currently waiting to respond (show loader)
  const [agentsWaitingToRespond, setAgentsWaitingToRespond] = useState<
    Set<string>
  >(() => {
    // If we have a pending message, mark the agent as waiting
    if (pendingMessage) {
      return new Set([pendingMessage.agent._id])
    }
    return new Set()
  })

  // Track streaming messages locally when using pendingMessage
  const [streamingMessages, setStreamingMessages] = useState<Message[]>([])

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
    addOrUpdateMessage,
    refetch: refetchSession,
    fetchOlderMessages,
    getPaginationData,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  useEffect(() => {
    if (!session || !sessionId || sessionId === 'new') return
    if (!isSignedIn) return
    if (lastSyncedSessionIdRef.current === sessionId) return

    const agentIds = Array.from(
      new Set((session.agents || []).map(agent => agent._id).filter(Boolean)),
    )

    if (agentIds.length === 0) return

    const syncPreferences = async () => {
      try {
        await Promise.all(agentIds.map(id => updateUserPreferences(id)))
        lastSyncedSessionIdRef.current = sessionId
      } catch (error) {
        console.error('Failed to update recent agents from session view', error)
      } finally {
        void queryClient.refetchQueries({ queryKey: ['user-preferences'] })
      }
    }

    syncPreferences()
  }, [isSignedIn, queryClient, session, sessionId, updateUserPreferences])

  // Update session settings when session data loads
  useEffect(() => {
    if (session) {
      // Loading session settings from session

      // Map session_type, defaulting to 'natural' if undefined or 'normal'
      let sessionType: 'natural' | 'automatic' = 'natural'
      if (session.session_type === 'automatic') {
        sessionType = 'automatic'
      }
      // 'normal' and undefined map to 'natural'

      setSessionSettings({
        type: sessionType,
        context: session.context || '',
        conductor_prompt: session.settings?.conductor_prompt || '',
        delay_interval: session.settings?.delay_interval || 0,
        mention_force_reply: session.settings?.mention_force_reply || false,
        manna_budget_unlimited: !session.budget?.manna_budget,
        manna_budget: session.budget?.manna_budget,
        token_budget_unlimited: !session.budget?.token_budget,
        token_budget: session.budget?.token_budget,
        turn_budget_unlimited: !session.budget?.turn_budget,
        turn_budget: session.budget?.turn_budget,
        exclude_memory: session.extras?.exclude_memory || false,
      })
    }
  }, [session])

  const sessionsLayoutContext = useSessionsLayoutContext()
  const isOwner = useMemo(() => {
    return user?._id === session?.owner?._id
  }, [user, session])
  const canOpenSessionSettings = isOwner && isSessionSettingsAllowed
  const isPublicSession = session?.extras?.is_public === true
  const isReadOnlySession = Boolean(
    session && sessionId && sessionId !== 'new' && isPublicSession && !isOwner,
  )

  // Agent settings modal state for navbar
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false)
  const [isAgentSettingsMemoriesOnly, setIsAgentSettingsMemoriesOnly] =
    useState(false)

  // Get the single agent for permission check (only when there's one agent)
  const singleAgent = session?.agents?.length === 1 ? session.agents[0] : null
  const { hasEditAccess: singleAgentHasEditAccess } = useAgentPermissions(
    singleAgent,
    user?._id,
  )

  useEffect(() => {
    if (!sessionsLayoutContext) {
      return
    }
    sessionsLayoutContext.setForceHideSidebar(isReadOnlySession)
  }, [sessionsLayoutContext, isReadOnlySession])

  useEffect(() => {
    return () => {
      sessionsLayoutContext?.setForceHideSidebar(false)
    }
  }, [sessionsLayoutContext])

  // State to store trigger data
  const [triggerData, setTriggerData] = useState<{ context: string } | null>(
    null,
  )

  useEffect(() => {
    if (session?.trigger) {
      const fetchTrigger = async () => {
        try {
          const agentId = session.agents?.[0]?._id
          if (!agentId) {
            setTriggerData(null)
            return
          }

          const response = await axios.get(
            `/api/agents/${agentId}/triggers/${session.trigger}`,
          )

          setTriggerData(response.data.trigger || null)
        } catch (error) {
          setTriggerData(null)
        }
      }

      fetchTrigger()
    } else {
      setTriggerData(null)
    }
  }, [session])

  // Create pending session data when we have a pendingMessage
  const pendingSession = useMemo(() => {
    if (!pendingMessage || !user) return null

    return {
      _id: 'pending',
      agents: [pendingMessage.agent],
      messages: [
        {
          _id: `pending-user-${Date.now()}`,
          content: pendingMessage.content,
          attachments: pendingMessage.attachments || [],
          sender: {
            _id: user._id,
            username: user.username,
            name: user.username,
            userImage: user.userImage,
          },
          role: 'user' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          session: 'pending',
          reactions: {},
        },
      ],
    }
  }, [pendingMessage, user])

  // Use pending session if we have one, otherwise use real session
  const displaySession = pendingMessage ? pendingSession : session

  // Call onSessionLoaded when we have real session data and were previously in pending mode
  useEffect(() => {
    if (
      pendingMessage &&
      session &&
      session.messages &&
      session.messages.length > 0 &&
      onSessionLoaded
    ) {
      onSessionLoaded()
    }
  }, [pendingMessage, session, onSessionLoaded])

  useEffect(() => {
    // Only connect to SSE if streaming is enabled
    if (!sessionConfig.useStreaming) {
      return
    }

    // Don't connect to SSE if we don't have a real session ID yet
    if (!sessionId || sessionId === 'new') {
      return
    }

    let eventSource: EventSource | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null
    let isCleaningUp = false
    let lastMessageTime = Date.now()
    let reconnectAttempts = 0
    let isReconnection = false
    const MAX_RECONNECT_ATTEMPTS = 5
    const INITIAL_RECONNECT_DELAY = 1000
    const MAX_RECONNECT_DELAY = 30000
    const HEARTBEAT_INTERVAL = 30000 // Check connection every 30 seconds
    const STALE_CONNECTION_THRESHOLD = 60000 // Consider connection stale after 60 seconds

    // Track multiple concurrent streams
    const streamingMessages = new Map<
      string,
      {
        accumulatedTokens: string
        agent: Agent
        messageId: string
      }
    >()

    const connectToStream = () => {
      if (isCleaningUp) return

      try {
        const streamUrl = `/api/sessions/${sessionId}/stream`

        setConnectionState(
          reconnectAttempts > 0 ? 'reconnecting' : 'connecting',
        )

        if (eventSource) {
          eventSource.close()
          eventSource = null
        }

        eventSource = new EventSource(streamUrl)

        eventSource.onopen = () => {
          lastMessageTime = Date.now()
          setConnectionState('connected')

          // Refetch session data to catch up on any missed messages
          // This is especially important after reconnecting from tab switch
          if (isReconnection) {
            refetchSession()
          }

          reconnectAttempts = 0 // Reset attempts on successful connection
          isReconnection = true // Mark future connections as reconnections

          // Start heartbeat to monitor connection health
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
          }

          heartbeatInterval = setInterval(() => {
            if (!isCleaningUp) {
              const timeSinceLastMessage = Date.now() - lastMessageTime
              if (timeSinceLastMessage > STALE_CONNECTION_THRESHOLD) {
                if (eventSource) {
                  eventSource.close()
                  eventSource = null
                }
                reconnectAttempts = 0
                connectToStream()
              }
            }
          }, HEARTBEAT_INTERVAL)
        }

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data)
            lastMessageTime = Date.now() // Update last message time

            // Handle session updates from SSE
            if (data.type === 'start_prompt') {
              const agent = data.agent
              const agentId = agent?._id
              const runId = data.session_run_id
              const messageId = `streaming-${sessionId}-${runId}`

              // Initialize streaming state for this run
              streamingMessages.set(runId, {
                accumulatedTokens: '',
                agent: agent,
                messageId: messageId,
              })

              // Mark this agent as waiting (shows loader)
              if (agentId) {
                setAgentsWaitingToRespond(prev => new Set(prev).add(agentId))
              }
            } else if (data.type === 'assistant_token') {
              const runId = data.session_run_id
              const streamState = streamingMessages.get(runId)

              if (!streamState) {
                return // No streaming state for this run
              }

              const agentId = streamState.agent._id

              // First token received - remove loader for this agent
              if (agentId && streamState.accumulatedTokens === '') {
                setAgentsWaitingToRespond(prev => {
                  const next = new Set(prev)
                  next.delete(agentId)
                  return next
                })
              }

              // Accumulate tokens for this specific stream
              streamState.accumulatedTokens += data.text

              // Create/update streaming message
              const streamingMessage: Message = {
                _id: streamState.messageId,
                session: sessionId,
                role: 'assistant',
                content: streamState.accumulatedTokens,
                sender: streamState.agent,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachments: [],
                reactions: {},
              }

              // Use local state if query is disabled (pendingMessage mode)
              if (pendingMessage) {
                setStreamingMessages(prev => {
                  const existing = prev.findIndex(
                    m => m._id === streamingMessage._id,
                  )
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = streamingMessage
                    return updated
                  }
                  return [...prev, streamingMessage]
                })
              } else {
                addOrUpdateMessage(streamingMessage)
              }
            } else if (data.type === 'assistant_message' && data.message) {
              const message = data.message as Message
              const runId = data.session_run_id
              const streamState = streamingMessages.get(runId)

              // If we have a streaming state and this message has tool calls, merge them
              if (
                streamState &&
                message.tool_calls &&
                message.tool_calls.length > 0
              ) {
                // Remove loader for this agent since we got a tool call message
                const agentId = streamState.agent._id
                if (agentId) {
                  setAgentsWaitingToRespond(prev => {
                    const next = new Set(prev)
                    next.delete(agentId)
                    return next
                  })
                }

                const mergedMessage: Message = {
                  ...message,
                  _id: streamState.messageId,
                  content: streamState.accumulatedTokens, // Keep the streamed content
                }
                if (pendingMessage) {
                  setStreamingMessages(prev => {
                    const existing = prev.findIndex(
                      m => m._id === mergedMessage._id,
                    )
                    if (existing >= 0) {
                      const updated = [...prev]
                      updated[existing] = mergedMessage
                      return updated
                    }
                    return [...prev, mergedMessage]
                  })
                } else {
                  addOrUpdateMessage(mergedMessage)
                }
                // Reset accumulated tokens for potential post-tool streaming
                streamState.accumulatedTokens = ''
              } else if (message.tool_calls && message.tool_calls.length > 0) {
                // Add tool call messages immediately
                if (pendingMessage) {
                  setStreamingMessages(prev => [...prev, message])
                } else {
                  addOrUpdateMessage(message)
                }
              } else if (!streamState) {
                // If we didn't create a streaming message (shouldn't happen in streaming mode)
                // This should never happen in streaming mode
                if (pendingMessage) {
                  setStreamingMessages(prev => [...prev, message])
                } else {
                  addOrUpdateMessage(message)
                }
              }
              // If we have streamState but no tool calls, ignore this message
              // because it should have been streamed already
            } else if (data.type === 'user_message' && data.message) {
              // Handle user messages from other users in multi-user sessions
              const userMessage = data.message as Message

              // Skip processing user messages that are from the current user
              // to avoid duplicating optimistic messages
              const isCurrentUser = user?._id === userMessage.sender?._id
              if (isCurrentUser) {
                return
              }

              if (pendingMessage) {
                setStreamingMessages(prev => [...prev, userMessage])
              } else {
                addOrUpdateMessage(userMessage)
              }
            } else if (data.type === 'end_prompt') {
              const runId = data.session_run_id
              const streamState = streamingMessages.get(runId)

              // Make sure agent loader is removed before clearing state
              if (streamState && streamState.agent._id) {
                setAgentsWaitingToRespond(prev => {
                  const next = new Set(prev)
                  next.delete(streamState.agent._id)
                  return next
                })
              }

              // Clear streaming state for this specific run
              if (runId) {
                streamingMessages.delete(runId)
              }
            } else if (
              data.type === 'tool_complete' ||
              data.type === 'tool_cancelled'
            ) {
              // Tool updates - refetch to get updated data from DB
              refetchSession()
            }
          } catch (error) {
            console.error('[Session Stream] Failed to parse message:', error)
          }
        }

        eventSource.onerror = () => {
          setConnectionState('disconnected')

          if (!isCleaningUp && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            eventSource?.close()
            eventSource = null

            // Calculate reconnect delay with exponential backoff
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
              MAX_RECONNECT_DELAY,
            )

            reconnectAttempts += 1

            reconnectTimeout = setTimeout(() => {
              if (!isCleaningUp) {
                connectToStream()
              }
            }, delay)
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            eventSource?.close()
            eventSource = null
          }
        }
      } catch (error) {
        // Attempt reconnection on initial connection failure
        if (!isCleaningUp && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
            MAX_RECONNECT_DELAY,
          )
          reconnectAttempts += 1

          reconnectTimeout = setTimeout(() => {
            if (!isCleaningUp) {
              connectToStream()
            }
          }, delay)
        }
      }
    }

    // Handle visibility changes - reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If we don't have an active EventSource or it's closed, reconnect
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          reconnectAttempts = 0 // Reset attempts for visibility-based reconnection
          connectToStream()
        } else if (eventSource.readyState === EventSource.OPEN) {
          // Check if we've received messages recently (within last 60 seconds)
          const timeSinceLastMessage = Date.now() - lastMessageTime
          if (timeSinceLastMessage > 60000) {
            eventSource.close()
            eventSource = null
            reconnectAttempts = 0
            connectToStream()
          }
        }
      }
    }

    // Handle page focus - similar to visibility but more aggressive
    const handleFocus = () => {
      // Force reconnect if connection is not open
      if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
        reconnectAttempts = 0
        connectToStream()
      }
    }

    connectToStream()

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      isCleaningUp = true

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }

      if (eventSource) {
        eventSource.close()
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [sessionId, addOrUpdateMessage, refetchSession, pendingMessage, user])

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
    onSessionCreated: (newSessionId: string) => {
      setCurrentSessionId(newSessionId)
      // Also navigate to the new session URL to keep URL in sync
      if (ischatRoute && params?.agentId) {
        router.replace(`/chat/${params.agentId}/${newSessionId}`)
      } else {
        router.replace(`/sessions/${newSessionId}`)
      }
    },
  })

  // Unified optimistic messages state
  const streamingOptimisticMessages = useRef<Message[]>([])
  const optimisticMessages = sessionConfig.useStreaming
    ? streamingOptimisticMessages.current
    : nonStreamingState.optimisticMessages

  // Error handling function
  const handleError = useCallback(
    (error: string) => {
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
          displaySession?.agents && displaySession.agents.length > 0
            ? displaySession.agents[0]
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
    if (displaySession?.agents && displaySession.agents.length > 0) {
      const sessionAgent = displaySession.agents[0]
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
  }, [streamingState.streamingAgent, displaySession?.agents])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Track previous message count to detect new messages vs older messages
  const previousMessageCountRef = useRef<number>(0)

  // Scroll to bottom on initial load and new messages (but not when loading older messages)
  useEffect(() => {
    const currentMessageCount = displaySession?.messages?.length || 0
    const previousMessageCount = previousMessageCountRef.current

    if (
      !hasTriggeredInitialScroll &&
      displaySession?.messages &&
      currentMessageCount > 0
    ) {
      setHasTriggeredInitialScroll(true)
      // Delay to ensure DOM has rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
      previousMessageCountRef.current = currentMessageCount
    } else if (
      hasTriggeredInitialScroll &&
      currentMessageCount > previousMessageCount &&
      !isLoadingOlderMessages
    ) {
      // Only scroll if message count increased AND we're not loading older messages
      // Check if we're near the bottom already (user is viewing recent messages)
      const container = messagesContainerRef.current
      if (container) {
        const hasScrollbar = container.scrollHeight > container.clientHeight
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight
        const isNearBottom = hasScrollbar && distanceFromBottom < 200

        if (isNearBottom) {
          scrollToBottom()
        }
      }
      previousMessageCountRef.current = currentMessageCount
    } else {
      // Update count even if we didn't scroll
      previousMessageCountRef.current = currentMessageCount
    }
  }, [
    displaySession?.messages,
    scrollToBottom,
    hasTriggeredInitialScroll,
    isLoadingOlderMessages,
  ])

  // Handle scroll to detect when user scrolls near top for reverse pagination
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !sessionId || sessionId === 'new') {
      return
    }

    const handleScroll = async () => {
      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight

      // Trigger when we're within 2 viewports from the top (aggressive pre-loading)
      const scrollThreshold = clientHeight * 2

      if (scrollTop < scrollThreshold && !isLoadingOlderMessages) {
        const paginationData = getPaginationData()

        if (paginationData?.hasMore) {
          setIsLoadingOlderMessages(true)

          // Store current scroll position
          const previousScrollHeight = container.scrollHeight
          const previousScrollTop = container.scrollTop
          try {
            const result = await fetchOlderMessages()

            if (result.messages.length > 0) {
              // Wait for DOM to update
              setTimeout(() => {
                // Restore scroll position
                const newScrollHeight = container.scrollHeight
                const scrollDiff = newScrollHeight - previousScrollHeight
                container.scrollTop = previousScrollTop + scrollDiff
              }, 0)
            }
          } catch (error) {
            console.error(
              '[Message Pagination] Failed to load older messages:',
              error,
            )
          } finally {
            setIsLoadingOlderMessages(false)
          }
        }
      }
    }

    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [
    sessionId,
    isLoadingOlderMessages,
    fetchOlderMessages,
    getPaginationData,
    displaySession,
  ])

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
  const getAgentIdsFromMentions = useCallback(
    (mentions: string[]): string[] => {
      if (!displaySession?.agents) return []

      const agentIds: string[] = []

      for (const mention of mentions) {
        if (mention === 'agent') {
          // @agent means all agents
          return displaySession.agents.map(agent => agent._id)
        } else {
          // Find specific agent by username
          const agent = displaySession.agents.find(a => a.username === mention)
          if (agent) {
            agentIds.push(agent._id)
          }
        }
      }

      return agentIds
    },
    [displaySession?.agents],
  )

  // Get responding agents based on mentions
  const getRespondingAgents = useCallback(
    (
      agentIds: string[],
    ): Array<{
      _id: string
      username: string
      name: string
      userImage?: string
    }> => {
      if (!displaySession?.agents || agentIds.length === 0) {
        // Only fallback to first agent in single-agent sessions
        // In multi-agent sessions, no mentions = no loaders
        if (displaySession?.agents && displaySession.agents.length === 1) {
          const agent = displaySession.agents[0]
          return [
            {
              _id: agent._id,
              username: agent.username,
              name: agent.name,
              userImage: agent.userImage?.startsWith('https://')
                ? agent.userImage
                : getCloudfrontUrl(agent.userImage),
            },
          ]
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
    },
    [session],
  )

  const filteredMessages = useMemo(() => {
    const existingMessages =
      displaySession?.messages?.filter(m => {
        const hasRole =
          m.role === 'user' ||
          m.role === 'assistant' ||
          m.role === 'eden' ||
          m.role === 'system'
        const hasContent = m.content && m.content.trim() !== ''
        const hasToolCalls =
          m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0
        const hasEdenData = m.role === 'eden' && m.eden_message_data

        return (
          hasRole &&
          (hasContent || hasToolCalls || hasEdenData) &&
          // Filter out eden messages with agent_add and agent_remove types in chat routes
          !(
            ischatRoute &&
            m.role === 'eden' &&
            m.eden_message_data &&
            (m.eden_message_data.message_type === 'agent_add' ||
              m.eden_message_data.message_type === 'agent_remove')
          )
        )
      }) ?? []

    // Prepend session context and trigger context system messages if they exist
    let messagesWithContext = existingMessages

    // Add trigger context message if trigger data exists
    if (triggerData && triggerData.context) {
      const triggerSystemMessage = {
        _id: `trigger-context-${sessionId}`,
        session: sessionId,
        role: 'system' as const,
        content: triggerData.context,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        attachments: [],
        reactions: {},
        sender: { _id: 'system', username: 'system', name: 'System' },
        trigger_context: true,
      } as Message & { trigger_context: boolean }

      messagesWithContext = [triggerSystemMessage, ...messagesWithContext]
    }

    // Add session context message if session context exists (displayed above trigger context)
    if (session?.context && session.context.trim()) {
      const sessionContextMessage = {
        _id: `session-context-${sessionId}`,
        session: sessionId,
        role: 'system' as const,
        content: session.context,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        attachments: [],
        reactions: {},
        sender: { _id: 'system', username: 'system', name: 'System' },
        session_context: true,
      } as Message & { session_context: boolean }

      messagesWithContext = [sessionContextMessage, ...messagesWithContext]
    }

    if (sessionId === 'new' && isSessionLoading) {
      return [...messagesWithContext, ...optimisticMessages]
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
      return [...messagesWithContext, ...uniqueOptimisticMessages]
    }

    // In streaming mode, include optimistic messages but avoid duplicates
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

    // Include local streaming messages when in pendingMessage mode
    return [
      ...messagesWithContext,
      ...uniqueOptimisticMessages,
      ...streamingMessages,
    ]
  }, [
    displaySession?.messages,
    sessionId,
    isSessionLoading,
    optimisticMessages,
    ischatRoute,
    streamingMessages,
    triggerData,
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
    // Parse the error to determine the type
    let errorTitle = 'Session Load Error'
    let errorMessage = "We couldn't load this session. Please try again later."

    if (axios.isAxiosError(sessionError)) {
      const status = sessionError.response?.status
      const apiMessage =
        sessionError.response?.data?.message ||
        sessionError.response?.data?.error

      if (status === 404) {
        errorTitle = 'Session Not Found'
        errorMessage =
          apiMessage || "This session doesn't exist or may have been deleted."
      } else if (status === 403) {
        errorTitle = 'Access Denied'
        errorMessage =
          apiMessage ||
          "You don't have permission to view this session. It may be private or belong to another user."
      } else if (status === 401) {
        errorTitle = 'Authentication Required'
        errorMessage = 'Please sign in to view this session.'
      } else if (status && status >= 500) {
        errorTitle = 'Server Error'
        errorMessage =
          apiMessage ||
          'There was a problem loading the session. Please try again later.'
      } else {
        // Handle other status codes
        errorTitle = `Error (${status || 'Unknown'})`
        errorMessage =
          apiMessage ||
          sessionError.message ||
          'An unexpected error occurred while loading the session.'
      }
    } else {
      // Non-axios errors (e.g., network errors, parsing errors, or custom errors from useSessionQuery)
      if (sessionError?.message === 'Session not found') {
        errorTitle = 'Session Not Found'
        errorMessage = "This session doesn't exist or may have been deleted."
      } else {
        errorMessage =
          sessionError?.message ||
          "We couldn't load this session. Please check your connection and try again."
      }
    }

    return (
      <div className="flex mx-auto py-16 md:w-1/2 w-[calc(100%-2rem)]">
        <AlertDestructive>
          <AlertDescription>
            <strong>{errorTitle}</strong>
            <br />
            {errorMessage}
          </AlertDescription>
        </AlertDestructive>
      </div>
    )
  }

  // Show loading indicator if:
  // 1. We're loading and don't have session data yet
  // 2. We're on a 'new' session
  // BUT don't show loading if there's an error, if we have session data with empty messages,
  // OR if we're in a pending transition from session creation OR if we have pendingMessage
  const shouldShowLoadingSpinner =
    !sessionError &&
    isSessionLoading &&
    !session &&
    sessionId !== 'new' &&
    !isPendingTransition &&
    !pendingMessage

  const handleSaveSettings = async (settings: SessionSettings) => {
    try {
      // Build request body exactly like EditSessionModal and /sessions/new
      const requestBody: {
        session_type: SessionType
        settings: {
          conductor_prompt: string
          delay_interval: number
          mention_force_reply: boolean
        }
        context?: string
        budget?: {
          manna_budget?: number
          token_budget?: number
          turn_budget?: number
        }
        extras?: {
          exclude_memory?: boolean
        }
      } = {
        session_type:
          settings.type === 'natural'
            ? SessionType.NATURAL
            : SessionType.AUTOMATIC,
        settings: {
          conductor_prompt: settings.conductor_prompt || '',
          delay_interval: settings.delay_interval,
          mention_force_reply: settings.mention_force_reply,
        },
      }

      if (settings.context && settings.context.trim()) {
        requestBody.context = settings.context
      }

      const budget: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      } = {}
      if (!settings.manna_budget_unlimited && settings.manna_budget) {
        budget.manna_budget = settings.manna_budget
      }
      if (!settings.token_budget_unlimited && settings.token_budget) {
        budget.token_budget = settings.token_budget
      }
      if (!settings.turn_budget_unlimited && settings.turn_budget) {
        budget.turn_budget = settings.turn_budget
      }
      if (Object.keys(budget).length > 0) {
        requestBody.budget = budget
      }

      // Add exclude_memory to extras
      if (settings.exclude_memory) {
        requestBody.extras = {
          exclude_memory: true,
        }
      }

      // Saving session settings

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to update session:', errorData)
        throw new Error(errorData.message || 'Failed to update session')
      }

      await response.json()
      // Session updated

      await refetchSession()

      toast({
        title: 'Session updated successfully!',
        description: 'Your changes have been saved.',
      })

      router.refresh()
    } catch (error) {
      console.error('Session update error:', error)
      toast({
        title: 'Error updating session',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      })
      throw error
    }
  }

  if (shouldShowLoadingSpinner) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoadingIndicator className="w-10 h-10 text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Mobile navbar - Icon buttons only (CHAT ROUTES ONLY - sessions uses SessionsHeader) */}
      {sessionId && sessionId !== 'new' && session && ischatRoute && (
        <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
          {/* Hamburger menu */}
          <button
            onClick={() => {
              // Try context first, fallback to prop
              if (sessionsLayoutContext?.openSidebar) {
                sessionsLayoutContext.openSidebar()
              } else if (onOpenSidebar) {
                onOpenSidebar()
              }
            }}
            className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Left section - Agent avatars and session title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {session.agents && session.agents.length > 0 && (
              <>
                {/* Agent avatars - clickable menu */}
                <AgentAvatarsMenu agents={session.agents}>
                  <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                    <div className="flex -space-x-2">
                      {session.agents.slice(0, 3).map((agent, index) => (
                        <div
                          key={agent._id}
                          className="relative w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                          style={{ zIndex: session.agents.length - index }}
                        >
                          {agent.userImage ? (
                            <img
                              src={getCloudfrontUrl(agent.userImage)}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                              {agent.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {session.agents.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{session.agents.length - 3}
                      </span>
                    )}
                  </button>
                </AgentAvatarsMenu>

                {/* Session title - clickable for settings */}
                {session.title && (
                  <button
                    onClick={() =>
                      canOpenSessionSettings && setIsSessionSettingsOpen(true)
                    }
                    className={cn(
                      'text-base font-semibold truncate flex-1 text-left',
                      canOpenSessionSettings
                        ? 'text-foreground hover:text-foreground transition-colors'
                        : 'text-muted-foreground',
                    )}
                    title={session.title}
                    disabled={!canOpenSessionSettings}
                  >
                    {session.title}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right section - Icon-only buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Settings/Memories button - show for single agent in chat route */}
            {ischatRoute && session.agents?.length === 1 && (
              <button
                onClick={() => {
                  if (singleAgentHasEditAccess) {
                    setIsAgentSettingsMemoriesOnly(false)
                  } else {
                    setIsAgentSettingsMemoriesOnly(true)
                  }
                  setIsAgentSettingsOpen(true)
                }}
                className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                title={
                  singleAgentHasEditAccess ? 'Agent Settings' : 'View Memories'
                }
              >
                {singleAgentHasEditAccess ? (
                  <Settings className="h-4 w-4" />
                ) : (
                  <BrainIcon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Share button - icon only */}
            {isOwner && (
              <SessionShareButton
                sessionId={sessionId as string}
                messages={session.messages || []}
                isOwner={isOwner}
                isPublic={session.extras?.is_public}
                className="h-9 w-9 px-0"
                hideText
              />
            )}

            {/* New Chat button - icon only */}
            <button
              onClick={() => {
                // Create URL with current session's agents
                const agentKeys = session?.agents
                  ?.map(a => a.username || a._id)
                  .join(',')
                router.push(agentKeys ? `/chat?agent=${agentKeys}` : '/chat')
              }}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              title="New Chat"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop navbar - Agent avatars + session title + buttons */}
      {sessionId && sessionId !== 'new' && session && (
        <div className="hidden md:flex h-12 items-center gap-4 border-b border-l-0 bg-background px-4 flex-shrink-0">
          {/* Left section - Agent avatars and session title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {session.agents && session.agents.length > 0 && (
              <>
                {/* Agent avatars - clickable menu */}
                <AgentAvatarsMenu agents={session.agents}>
                  <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                    <div className="flex -space-x-2">
                      {session.agents.slice(0, 3).map((agent, index) => (
                        <div
                          key={agent._id}
                          className="relative w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                          style={{ zIndex: session.agents.length - index }}
                        >
                          {agent.userImage ? (
                            <img
                              src={getCloudfrontUrl(agent.userImage)}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                              {agent.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {session.agents.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{session.agents.length - 3}
                      </span>
                    )}
                  </button>
                </AgentAvatarsMenu>

                {/* Session title - clickable for settings */}
                {session.title && (
                  <button
                    onClick={() =>
                      canOpenSessionSettings && setIsSessionSettingsOpen(true)
                    }
                    className={cn(
                      'text-base font-semibold truncate flex-1 max-w-[400px] text-left ml-2',
                      canOpenSessionSettings
                        ? 'text-foreground hover:text-foreground transition-colors'
                        : 'text-muted-foreground',
                    )}
                    title={session.title}
                    disabled={!canOpenSessionSettings}
                  >
                    {session.title}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right section - Share, New Chat/Session (no Status Toggle for chat) */}
          <div className="flex items-center gap-2">
            {/* Status Toggle - only show for automatic sessions, not chat */}
            {!ischatRoute &&
              isOwner &&
              session.session_type === 'automatic' && (
                <SessionStatusToggle
                  sessionId={sessionId as string}
                  currentStatus={session.status}
                  onStatusChange={newStatus => {
                    // Update session in cache
                    if (session) {
                      session.status = newStatus
                    }
                  }}
                />
              )}

            {/* Settings/Memories button - show for single agent in chat route */}
            {ischatRoute && session.agents?.length === 1 && (
              <button
                onClick={() => {
                  if (singleAgentHasEditAccess) {
                    setIsAgentSettingsMemoriesOnly(false)
                  } else {
                    setIsAgentSettingsMemoriesOnly(true)
                  }
                  setIsAgentSettingsOpen(true)
                }}
                className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                title={
                  singleAgentHasEditAccess ? 'Agent Settings' : 'View Memories'
                }
              >
                {singleAgentHasEditAccess ? (
                  <Settings className="h-3.5 w-3.5" />
                ) : (
                  <BrainIcon className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {/* Share button */}
            {isOwner && (
              <SessionShareButton
                sessionId={sessionId as string}
                messages={session.messages || []}
                isOwner={isOwner}
                isPublic={session.extras?.is_public}
                className="h-8 px-3"
              />
            )}

            {/* New Chat button */}
            <button
              onClick={() => {
                // Create URL with current session's agents
                const agentKeys = session?.agents
                  ?.map(a => a.username || a._id)
                  .join(',')
                router.push(agentKeys ? `/chat?agent=${agentKeys}` : '/chat')
              }}
              className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
              title="New Chat"
            >
              <EditIcon className="h-3.5 w-3.5" />
              New Chat
            </button>
          </div>
        </div>
      )}

      {/* Connection status indicator - only show when not connected and using SSE streaming */}
      {sessionConfig.useStreaming &&
        connectionState !== 'connected' &&
        sessionId &&
        sessionId !== 'new' && (
          <div className="fixed top-4 right-4 z-50 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
            {connectionState === 'connecting' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">Connecting...</span>
              </>
            )}
            {connectionState === 'reconnecting' && (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">Reconnecting...</span>
              </>
            )}
            {connectionState === 'disconnected' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-muted-foreground">Disconnected</span>
              </>
            )}
          </div>
        )}

      <div
        ref={messagesContainerRef}
        className={cn(
          'flex-1 min-h-0 overflow-y-auto pb-4',
          messageGroups.length === 0 &&
            'flex flex-col justify-center items-center',
        )}
      >
        <div className="p-4 pb-8 max-w-[51rem] mx-auto w-full">
          {/* Load more button for older messages */}
          {!isLoadingOlderMessages && getPaginationData()?.hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={async () => {
                  setIsLoadingOlderMessages(true)

                  const container = messagesContainerRef.current
                  if (!container) return

                  // Store current scroll position before loading
                  const previousScrollHeight = container.scrollHeight
                  const previousScrollTop = container.scrollTop

                  try {
                    const result = await fetchOlderMessages()

                    if (result.messages.length > 0) {
                      // Wait for DOM to update with new messages
                      setTimeout(() => {
                        const newScrollHeight = container.scrollHeight
                        const scrollDiff =
                          newScrollHeight - previousScrollHeight

                        // Position at roughly 20% from top (in the trigger zone for next load)
                        const newScrollableHeight =
                          newScrollHeight - container.clientHeight
                        const targetScrollTop = Math.min(
                          previousScrollTop + scrollDiff,
                          newScrollableHeight * 0.2,
                        )
                        container.scrollTop = targetScrollTop
                      }, 150)
                    }

                    // Keep loading state true for a bit longer to let React update
                    setTimeout(() => setIsLoadingOlderMessages(false), 200)
                  } catch (error) {
                    setIsLoadingOlderMessages(false)
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Load earlier messages
              </button>
            </div>
          )}

          {/* Loading indicator for older messages */}
          {isLoadingOlderMessages && (
            <div className="flex justify-center py-4">
              <LoadingIndicator className="w-6 h-6 text-purple-600" />
            </div>
          )}
          {/* Only show loading skeleton if we are on a new session */}
          {sessionId === 'new' && isSessionLoading ? (
            <div className="space-y-4">
              <MessageSkeleton />
              <MessageSkeleton />
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
                session?.messages?.filter((m: Message) => m.role === 'user') ||
                []
              const assistantMessages =
                session?.messages?.filter(
                  (m: Message) => m.role === 'assistant',
                ) || []
              const hasOnlyUserMessage =
                userMessages.length > 0 && assistantMessages.length === 0
              const isWaitingForFirstResponse =
                isNewSession && hasOnlyUserMessage

              if (isWaitingForFirstResponse) {
                // Parse mentions from the last user message to determine if we should show loader
                const lastUserMessage = userMessages[userMessages.length - 1]
                const mentions = lastUserMessage?.content
                  ? parseMentions(lastUserMessage.content)
                  : []
                const mentionedAgentIds = getAgentIdsFromMentions(mentions)
                const shouldShowLoader =
                  (displaySession?.agents &&
                    displaySession.agents.length === 1) ||
                  mentionedAgentIds.length > 0

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
                          : group[0].role === 'system'
                          ? group.map(message => (
                              <SystemMessage
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
                                <AssistantMessage
                                  sessionId={sessionId as string}
                                  key={message._id}
                                  message={message}
                                  showAvatar={true}
                                  isStreamingTokens={false}
                                  isChatRoute={ischatRoute}
                                />
                              ))}
                      </div>
                    ))}

                    {/* Render standalone loaders for agents waiting to respond */}
                    {Array.from(agentsWaitingToRespond).map(agentId => {
                      const agent = displaySession?.agents?.find(
                        a => a._id === agentId,
                      )
                      if (!agent) return null

                      return (
                        <div key={`loader-${agentId}`} className="mb-4">
                          <AssistantMessage
                            sessionId={sessionId as string}
                            message={
                              {
                                _id: `loader-${agentId}`,
                                content: '',
                                sender: {
                                  _id: agent._id,
                                  username: agent.username,
                                  name: agent.name,
                                  userImage: agent.userImage?.startsWith(
                                    'https://',
                                  )
                                    ? agent.userImage
                                    : getCloudfrontUrl(agent.userImage),
                                },
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                session: sessionId,
                                role: 'assistant',
                              } as Message
                            }
                            showAvatar={true}
                            isStreamingTokens={true}
                            isChatRoute={ischatRoute}
                          />
                        </div>
                      )
                    })}

                    {/* Show agent typing indicator only if SSE hasn't confirmed yet and no streaming messages */}
                    {shouldShowLoader &&
                      agentsWaitingToRespond.size === 0 &&
                      streamingMessages.length === 0 && (
                        <div className="mb-4">
                          <AssistantMessage
                            sessionId={sessionId as string}
                            message={
                              {
                                _id: 'loading-first-response',
                                content: '',
                                sender:
                                  mentionedAgentIds.length > 0
                                    ? getRespondingAgents(
                                        mentionedAgentIds,
                                      )[0] || getRespondingAgent()
                                    : getRespondingAgent(),
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                session: sessionId,
                                role: 'assistant',
                              } as Message
                            }
                            showAvatar={true}
                            isStreamingTokens={true}
                            isChatRoute={ischatRoute}
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
                  ((session?.messages && session.messages.length > 0) ||
                    session?.title)
                ) {
                  return (
                    <div className="mb-4">
                      <AssistantMessage
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
                          } as Message
                        }
                        showAvatar={true}
                        isStreamingTokens={true}
                        isChatRoute={ischatRoute}
                      />
                    </div>
                  )
                }

                if (
                  sessionConfig.useStreaming &&
                  (streamingState.isStreamingTokens ||
                    streamingState.waitingForWebSocket) &&
                  ((session?.messages && session.messages.length > 0) ||
                    session?.title)
                ) {
                  return (
                    <div className="mb-4">
                      <AssistantMessage
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
                          } as Message
                        }
                        showAvatar={true}
                        isStreamingTokens={
                          streamingState.isStreamingTokens &&
                          !streamingState.hasReceivedTokens
                        }
                        isChatRoute={ischatRoute}
                      />
                    </div>
                  )
                }

                // Otherwise show welcome screen
                return displaySession?.agents &&
                  displaySession.agents.length > 0 ? (
                  <>
                    <SessionWelcome
                      variant="session"
                      agents={displaySession.agents}
                      sessionTitle={''}
                    />
                    {/* Show Start Session button if paused and no messages */}
                    {session?.status === 'paused' &&
                      messageGroups.length === 0 &&
                      isOwner && (
                        <div className="flex justify-center mt-8">
                          <button
                            onClick={async () => {
                              try {
                                // Send request to compute API to handle session status change
                                const response = await fetch(
                                  '/api/sessions/status',
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      session_id: sessionId,
                                      status: 'active',
                                    }),
                                  },
                                )

                                // Commented out: Direct MongoDB update
                                // const response = await fetch(
                                //   `/api/sessions/${sessionId}`,
                                //   {
                                //     method: 'PATCH',
                                //     headers: {
                                //       'Content-Type': 'application/json',
                                //     },
                                //     body: JSON.stringify({
                                //       status: 'active',
                                //     }),
                                //   },
                                // )

                                if (response.ok) {
                                  const result = await response.json()

                                  if (result.success && session) {
                                    session.status = 'active'
                                    refetchSession()
                                  } else {
                                    // Show error notification
                                    console.error(
                                      'Failed to start session:',
                                      result.error,
                                    )
                                  }
                                }
                              } catch (error) {
                                console.error('Failed to start session:', error)
                              }
                            }}
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                          >
                            Start Session
                          </button>
                        </div>
                      )}
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
                        : group[0].role === 'system'
                        ? group.map(message => (
                            <SystemMessage
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
                            .map((message, index) => (
                              <AssistantMessage
                                sessionId={sessionId as string}
                                key={message._id}
                                message={message}
                                isStreamingTokens={false}
                                showAvatar={index === 0}
                                isChatRoute={ischatRoute}
                              />
                            ))}
                    </div>
                  ))}

                  {/* Render standalone loaders for agents waiting to respond */}
                  {Array.from(agentsWaitingToRespond).map(agentId => {
                    const agent = displaySession?.agents?.find(
                      a => a._id === agentId,
                    )
                    if (!agent) return null

                    return (
                      <div key={`loader-${agentId}`}>
                        <AssistantMessage
                          sessionId={sessionId as string}
                          message={
                            {
                              _id: `loader-${agentId}`,
                              content: '',
                              sender: {
                                _id: agent._id,
                                username: agent.username,
                                name: agent.name,
                                userImage: agent.userImage?.startsWith(
                                  'https://',
                                )
                                  ? agent.userImage
                                  : getCloudfrontUrl(agent.userImage),
                              },
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              session: sessionId,
                              role: 'assistant',
                            } as Message
                          }
                          showAvatar={true}
                          isStreamingTokens={true}
                          isChatRoute={ischatRoute}
                        />
                      </div>
                    )
                  })}
                </>
              )
            })()
          )}

          {isReadOnlySession && (
            <div className="mt-12 mb-8 p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground text-center">
              This is a public conversation. You cannot interact with this
              session.
            </div>
          )}

          {/* Non-streaming loading indicator */}
          {!sessionConfig.useStreaming && (
            <NonStreamingMessageDisplay
              sessionId={sessionId as string}
              waitingForResponse={nonStreamingState.waitingForResponse}
              getRespondingAgents={() => {
                // Get agents from stored agent IDs
                return getRespondingAgents(
                  nonStreamingState.respondingAgentIds || [],
                )
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

      {!isReadOnlySession && (
        <div className="flex-shrink-0 bg-background p-4 z-10 border-t border-gray-800">
          <div className="max-w-[51rem] mx-auto w-full">
            <MessageInput
              sessionId={currentSessionId as string}
              enableLiveAudio={true}
              onStreamingMessage={(content, attachments, thinking) => {
                clearErrors()
                setCancelledNotice(false)

                // Parse mentions to get agent IDs
                const mentions = parseMentions(content)
                let agentIds = getAgentIdsFromMentions(mentions)

                // If no agent IDs and it's a single agent session, use the single agent
                if (
                  agentIds.length === 0 &&
                  displaySession?.agents &&
                  displaySession.agents.length === 1
                ) {
                  agentIds = [displaySession.agents[0]._id]
                }

                // For multi-agent sessions with no mentions, agentIds will remain empty array
                // This will still create the user message but won't trigger any agent responses

                if (sessionConfig.useStreaming) {
                  // Show optimistic loaders for responding agents
                  agentIds.forEach(agentId => {
                    setAgentsWaitingToRespond(prev =>
                      new Set(prev).add(agentId),
                    )
                  })

                  streamingState.initializeStreaming()
                  streamingState.sendMessage(content, attachments, {
                    agent_ids: agentIds,
                    thinking,
                  })

                  // Add optimistic user message only (agents show as loaders)
                  const optimisticUserMessage = {
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
                  } as Message

                  streamingOptimisticMessages.current = [
                    ...streamingOptimisticMessages.current,
                    optimisticUserMessage,
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

                  // Pass agent_ids and thinking in options
                  nonStreamingState.sendMessage(content, attachments, {
                    agent_ids: agentIds,
                    thinking,
                  })
                  setTimeout(scrollToBottom, 100)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Session Settings Modal */}
      {session && sessionId && sessionId !== 'new' && (
        <SessionSettingsModal
          open={isSessionSettingsOpen}
          onOpenChange={setIsSessionSettingsOpen}
          settings={sessionSettings}
          onSettingsChange={setSessionSettings}
          agents={session.agents}
          sessionId={sessionId}
          onSave={handleSaveSettings}
          minimal={true}
        />
      )}

      {/* Agent Settings Modal - for navbar settings/memories button */}
      {singleAgent && (
        <AgentSettingsModal
          agentId={singleAgent.username || singleAgent._id}
          open={isAgentSettingsOpen}
          onOpenChange={open => {
            setIsAgentSettingsOpen(open)
            if (!open) {
              setIsAgentSettingsMemoriesOnly(false)
            }
          }}
          initialTab={isAgentSettingsMemoriesOnly ? 'memories' : 'profile'}
          memoriesOnly={isAgentSettingsMemoriesOnly}
        />
      )}
    </div>
  )
}

export default Session
