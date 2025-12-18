'use client'

import { AgentAvatarsMenu } from './components/agent-avatars-menu'
import { AgentWorkspaces } from './components/agent-workspaces'
import { ChildSessionSidebar } from './components/child-session-sidebar'
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
import TypingIndicator from '@/features/sessions/components/typing-indicator'
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
import {
  Agent,
  Message,
  SessionPermissionLevel,
  SessionType,
  SessionV2,
} from '@edenlabs/eden-sdk'
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

const PlatformIcon = ({
  platform,
}: {
  platform: 'discord' | 'telegram' | 'twitter' | 'farcaster'
}) => {
  switch (platform) {
    case 'discord':
      return (
        <svg
          className="h-4 w-4 text-[#5865F2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg
          className="h-4 w-4 text-foreground shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'farcaster':
      return (
        <svg
          className="h-4 w-4 text-[#8A63D2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 4h18v16.5h-2.25v-1.5H5.25v1.5H3V4zm2.25 2.25v9.75h13.5V6.25H5.25zm3 2.25h7.5v1.5h-7.5v-1.5zm0 3h7.5v1.5h-7.5v-1.5z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg
          className="h-4 w-4 text-[#0088cc] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    default:
      return null
  }
}

const Session = ({
  optimisticSessionId,
  pendingMessage,
  onSessionLoaded,
  onOpenSidebar,
  hideNavbar,
}: {
  optimisticSessionId?: string
  pendingMessage?: {
    content: string
    attachments?: string[]
    agent: Agent
  }
  onSessionLoaded?: () => void
  onOpenSidebar?: () => void
  hideNavbar?: boolean
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
  const [childSessionId, setChildSessionId] = useState<string | null>(null)
  const [isChildSidebarOpen, setIsChildSidebarOpen] = useState(false)
  const [isUserTranscribing, setIsUserTranscribing] = useState(false)
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
  // IMPORTANT: Only sync from server when modal is CLOSED to avoid resetting user edits
  const hasInitializedSettings = useRef(false)

  useEffect(() => {
    if (session) {
      // Only sync settings from server if:
      // 1. This is the initial load (hasn't been initialized yet), OR
      // 2. The modal is closed (user isn't actively editing)
      if (!hasInitializedSettings.current || !isSessionSettingsOpen) {
        hasInitializedSettings.current = true

        // Map session_type, defaulting to 'natural' if undefined or 'passive'
        let sessionType: 'natural' | 'automatic' = 'natural'
        if (session.session_type === 'automatic') {
          sessionType = 'automatic'
        }

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
    }
  }, [session, isSessionSettingsOpen])

  const sessionsLayoutContext = useSessionsLayoutContext()
  const isOwner = useMemo(() => {
    return user?._id === session?.owner?._id
  }, [user, session])
  // Check if user can manage session (owner or has editor/owner permissions)
  const canManageSession = useMemo(() => {
    return (
      isOwner ||
      session?.permission_level_for_user === SessionPermissionLevel.Editor ||
      session?.permission_level_for_user === SessionPermissionLevel.Owner
    )
  }, [isOwner, session?.permission_level_for_user])
  const canOpenSessionSettings = canManageSession && isSessionSettingsAllowed
  const isPublicSession = session?.extras?.is_public === true
  const isReadOnlySession = Boolean(
    session &&
      sessionId &&
      sessionId !== 'new' &&
      isPublicSession &&
      !canManageSession,
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

    const shouldHideSidebar = isReadOnlySession && !isSignedIn
    sessionsLayoutContext.setForceHideSidebar(shouldHideSidebar)
  }, [sessionsLayoutContext, isReadOnlySession, isSignedIn])

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
          session: [{ _id: 'pending' } as SessionV2],
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
                session: [{ _id: sessionId } as SessionV2],
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

              if (streamState && streamState.agent?._id) {
                setAgentsWaitingToRespond(prev => {
                  const next = new Set(prev)
                  next.delete(streamState.agent._id)
                  return next
                })
              }

              const isRateLimitEden =
                message.role === 'eden' &&
                message.eden_message_data?.message_type === 'rate_limit'
              if (isRateLimitEden) {
                setAgentsWaitingToRespond(new Set())
                if (runId) {
                  streamingMessages.delete(runId)
                }
                streamingState.clearStreamingState()
              }

              // If we get any eden message (including rate limit), clear loaders defensively
              if (message.role === 'eden') {
                setAgentsWaitingToRespond(new Set())
                streamingMessages.clear()
              }

              // If we have a streaming state and this message has tool calls, merge them
              if (
                streamState &&
                message.tool_calls &&
                message.tool_calls.length > 0
              ) {
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
              } else {
                // Normal assistant message (including errors like rate limits)
                if (pendingMessage) {
                  setStreamingMessages(prev => [...prev, message])
                } else {
                  addOrUpdateMessage(message)
                }
                // If no streaming state exists, also clear loaders based on sender
                if (!streamState && message.sender?._id) {
                  setAgentsWaitingToRespond(prev => {
                    const next = new Set(prev)
                    next.delete(message.sender._id)
                    return next
                  })
                }
              }
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
              // Defensive: clear any loaders if no more active streams
              if (streamingMessages.size === 0) {
                setAgentsWaitingToRespond(new Set())
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
      setAgentsWaitingToRespond(new Set())

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

  // Scroll to a specific message by ID
  const scrollToMessage = useCallback((messageId: string) => {
    const container = messagesContainerRef.current
    if (!container) return

    // Find the message element by data-message-id attribute
    const messageElement = container.querySelector(
      `[data-message-id="${messageId}"]`,
    )
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a brief highlight effect
      messageElement.classList.add('bg-primary/10')
      setTimeout(() => {
        messageElement.classList.remove('bg-primary/10')
      }, 2000)
    }
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
        session: [{ _id: sessionId } as SessionV2],
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
        session: [{ _id: sessionId } as SessionV2],
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

  // Handler to open child session sidebar
  const handleChildSessionClick = useCallback((childId: string) => {
    setChildSessionId(childId)
    setIsChildSidebarOpen(true)
  }, [])

  // Handler to close child session sidebar
  const handleCloseChildSidebar = useCallback(() => {
    setIsChildSidebarOpen(false)
    // Delay clearing the ID to allow for smooth animation
    setTimeout(() => setChildSessionId(null), 300)
  }, [])

  // Enrich message sender with data from session.agents if sender is incomplete
  const enrichMessageSender = useCallback(
    (message: Message): Message => {
      if (!displaySession?.agents || displaySession.agents.length === 0) {
        return message
      }

      // If sender already has username and userImage, no need to enrich
      if (message.sender?.username && message.sender?.userImage) {
        return message
      }

      // Try to find matching agent - by sender._id if available, otherwise use first agent for assistant messages
      let matchingAgent = message.sender?._id
        ? displaySession.agents.find(a => a._id === message.sender?._id)
        : null

      // For assistant messages without a matching sender, use the first agent
      if (!matchingAgent && message.role === 'assistant') {
        matchingAgent = displaySession.agents[0]
      }

      if (!matchingAgent) {
        return message
      }

      // Merge sender with agent data (sender data takes precedence if present)
      return {
        ...message,
        sender: {
          _id: message.sender?._id || matchingAgent._id,
          username: message.sender?.username || matchingAgent.username,
          name: message.sender?.name || matchingAgent.name,
          userImage:
            message.sender?.userImage ||
            (matchingAgent.userImage?.startsWith('https://')
              ? matchingAgent.userImage
              : getCloudfrontUrl(matchingAgent.userImage)),
        },
      }
    },
    [displaySession?.agents],
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

  const handleSaveSettings = async (
    settings: SessionSettings,
    agents?: Agent[],
  ) => {
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
        agent_ids?: string[]
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

      // Add agent_ids if agents were changed
      if (agents && agents.length > 0) {
        requestBody.agent_ids = agents.map(a => a._id)
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
      {sessionId &&
        sessionId !== 'new' &&
        session &&
        ischatRoute &&
        !hideNavbar && (
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
                        'text-base font-semibold truncate flex-1 text-left flex items-center gap-2',
                        canOpenSessionSettings
                          ? 'text-foreground hover:text-foreground transition-colors'
                          : 'text-muted-foreground',
                      )}
                      title={session.title}
                      disabled={!canOpenSessionSettings}
                    >
                      <span className="truncate">{session.title}</span>
                      {/* Platform icon */}
                      {session.platform && (
                        <PlatformIcon platform={session.platform} />
                      )}
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
                    singleAgentHasEditAccess
                      ? 'Agent Settings'
                      : 'View Memories'
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
              {canManageSession && (
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
      {sessionId && sessionId !== 'new' && session && !hideNavbar && (
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

                {/* Session title - static display */}
                {session.title && (
                  <div
                    className="text-base font-semibold truncate flex-1 max-w-[400px] text-left ml-2 flex items-center gap-2 text-foreground"
                    title={session.title}
                  >
                    <span className="truncate">{session.title}</span>
                    {/* Platform icon */}
                    {session.platform && (
                      <PlatformIcon platform={session.platform} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right section - Share, New Chat/Session (no Status Toggle for chat) */}
          <div className="flex items-center gap-2">
            {/* Status Toggle - only show for automatic sessions, not chat */}
            {!ischatRoute &&
              canManageSession &&
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

            {/* Session Settings button - show for sessions routes (not chat) */}
            {!ischatRoute && canOpenSessionSettings && (
              <button
                onClick={() => setIsSessionSettingsOpen(true)}
                className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            )}

            {/* Share button */}
            {canManageSession && (
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

      {/* Split screen container for main session and child session sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main session messages */}
        <div
          ref={messagesContainerRef}
          className={cn(
            'flex-1 min-h-0 overflow-y-auto pb-4 relative',
            messageGroups.length === 0 &&
              'flex flex-col justify-center items-center',
          )}
        >
          {/* Floating Agent Workspaces button - desktop only */}
          {session?.agent_sessions &&
            Object.keys(session.agent_sessions).length > 0 && (
              <div className="hidden md:block sticky top-2 z-20 float-right mr-4">
                <AgentWorkspaces
                  agents={session.agents || []}
                  agentSessions={session.agent_sessions}
                  onOpenWorkspace={handleChildSessionClick}
                />
              </div>
            )}
          <div className="p-4 pb-8 max-w-[51rem] mx-auto w-full clear-both">
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
                  session?.messages?.filter(
                    (m: Message) => m.role === 'user',
                  ) || []
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
                                <div
                                  key={message._id}
                                  data-message-id={message._id}
                                  className="transition-colors duration-500"
                                >
                                  <EdenMessage message={message} />
                                </div>
                              ))
                            : group[0].role === 'system'
                            ? group.map(message => (
                                <div
                                  key={message._id}
                                  data-message-id={message._id}
                                  className="transition-colors duration-500"
                                >
                                  <SystemMessage message={message} />
                                </div>
                              ))
                            : isOwnMessage(group[0].sender?._id)
                            ? group.map(message => (
                                <div
                                  key={message._id}
                                  data-message-id={message._id}
                                  className="transition-colors duration-500"
                                >
                                  <UserMessage
                                    message={message}
                                    session={session}
                                  />
                                </div>
                              ))
                            : group
                                .filter(message => message.role !== 'tool')
                                .map((message, index) => (
                                  <div
                                    key={message._id}
                                    data-message-id={message._id}
                                    className="transition-colors duration-500"
                                  >
                                    <AssistantMessage
                                      sessionId={sessionId as string}
                                      message={enrichMessageSender(message)}
                                      showAvatar={index === 0}
                                      isStreamingTokens={false}
                                      isChatRoute={ischatRoute}
                                      onSessionClick={handleChildSessionClick}
                                    />
                                  </div>
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
                                  session: [{ _id: sessionId } as SessionV2],
                                  role: 'assistant',
                                } as Message
                              }
                              showAvatar={true}
                              isStreamingTokens={true}
                              isChatRoute={ischatRoute}
                              onSessionClick={handleChildSessionClick}
                            />
                          </div>
                        )
                      })}

                      {/* Show user transcribing indicator when voice is being transcribed */}
                      {isUserTranscribing && (
                        <div className="pt-2 pb-4 pl-[calc(3rem+0.75rem)]">
                          <div className="max-w-[42rem] ml-auto flex flex-col items-end">
                            <div className="flex flex-col items-end gap-2 max-w-[85%]">
                              <div className="bg-purple-100 dark:bg-[#3b1660] rounded-2xl px-4 py-3 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Transcribing
                                </span>
                                <TypingIndicator />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
                                  session: [{ _id: sessionId } as SessionV2],
                                  role: 'assistant',
                                } as Message
                              }
                              showAvatar={true}
                              isStreamingTokens={true}
                              isChatRoute={ischatRoute}
                              onSessionClick={handleChildSessionClick}
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
                              session: [{ _id: sessionId } as SessionV2],
                              role: 'assistant',
                            } as Message
                          }
                          showAvatar={true}
                          isStreamingTokens={true}
                          isChatRoute={ischatRoute}
                          onSessionClick={handleChildSessionClick}
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
                              session: [{ _id: sessionId } as SessionV2],
                              role: 'assistant',
                            } as Message
                          }
                          showAvatar={true}
                          isStreamingTokens={
                            streamingState.isStreamingTokens &&
                            !streamingState.hasReceivedTokens
                          }
                          isChatRoute={ischatRoute}
                          onSessionClick={handleChildSessionClick}
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
                                  console.error(
                                    'Failed to start session:',
                                    error,
                                  )
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
                              <div
                                key={message._id}
                                data-message-id={message._id}
                                className="transition-colors duration-500"
                              >
                                <EdenMessage message={message} />
                              </div>
                            ))
                          : group[0].role === 'system'
                          ? group.map(message => (
                              <div
                                key={message._id}
                                data-message-id={message._id}
                                className="transition-colors duration-500"
                              >
                                <SystemMessage message={message} />
                              </div>
                            ))
                          : isOwnMessage(group[0].sender?._id)
                          ? group.map(message => (
                              <div
                                key={message._id}
                                data-message-id={message._id}
                                className="transition-colors duration-500"
                              >
                                <UserMessage
                                  message={message}
                                  session={session}
                                />
                              </div>
                            ))
                          : group
                              .filter(message => message.role !== 'tool')
                              .map((message, index) => (
                                <div
                                  key={message._id}
                                  data-message-id={message._id}
                                  className="transition-colors duration-500"
                                >
                                  <AssistantMessage
                                    sessionId={sessionId as string}
                                    message={enrichMessageSender(message)}
                                    isStreamingTokens={false}
                                    showAvatar={index === 0}
                                    isChatRoute={ischatRoute}
                                    onSessionClick={handleChildSessionClick}
                                  />
                                </div>
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
                                session: [{ _id: sessionId } as SessionV2],
                                role: 'assistant',
                              } as Message
                            }
                            showAvatar={true}
                            isStreamingTokens={true}
                            isChatRoute={ischatRoute}
                            onSessionClick={handleChildSessionClick}
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

        {/* Child Session Sidebar - for viewing child sessions from tool results */}
        {childSessionId && (
          <ChildSessionSidebar
            sessionId={childSessionId}
            isOpen={isChildSidebarOpen}
            onClose={handleCloseChildSidebar}
          />
        )}
      </div>

      {!isReadOnlySession && (
        <div className="flex-shrink-0 bg-background p-4 z-10 border-t border-gray-800">
          <div className="max-w-[51rem] mx-auto w-full">
            <MessageInput
              sessionId={currentSessionId as string}
              enableVoiceInput={true}
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
                    session: [{ _id: sessionId } as SessionV2],
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
                    session: [{ _id: sessionId } as SessionV2],
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
              onTranscribingChange={setIsUserTranscribing}
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
          sessionTitle={session.title}
          onSave={handleSaveSettings}
          minimal={false}
          onNavigateToMessage={scrollToMessage}
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
