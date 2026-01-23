'use client'

import { AgentWorkspaces } from './components/agent-workspaces'
import { ArtifactSidebar } from './components/artifact-sidebar'
import { AutomaticSessionControls } from './components/automatic-session-controls'
import { ChildSessionSidebar } from './components/child-session-sidebar'
import { ErrorDisplay } from './components/error-display'
import { MessageInput } from './components/message-input'
import { NonStreamingMessageDisplay } from './components/non-streaming-message-display'
import { SessionMessageGroups } from './components/session-message-groups'
import SessionWelcome from './components/session-welcome'
import { ViewModerator } from './components/view-moderator'
import { useSessionsLayoutContext } from './context/sessions-layout-context'
import { useNonStreamingState } from './hooks/use-non-streaming-state'
import { useSessionCompletionConfetti } from './hooks/use-session-completion-confetti'
import NewSession from './new-session'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import TypingIndicator from '@/features/sessions/components/typing-indicator'
import { useUpdateUserPreferences } from '@/hooks/mutation/use-update-user-preferences'
import { useArtifactsV3ListQuery } from '@/hooks/query/use-artifacts-v3-list-query'
import { useSessionNotificationsQuery } from '@/hooks/query/use-session-notifications-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionTracking } from '@/hooks/use-session-tracking'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  Agent,
  Message,
  SessionPermissionLevel,
  SessionV2,
} from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BrainIcon } from 'lucide-react'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const Session = ({
  optimisticSessionId,
  pendingMessage,
  onSessionLoaded,
  onOpenSidebar: _onOpenSidebar,
  hideNavbar: _hideNavbar,
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
  void _onOpenSidebar
  void _hideNavbar
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sessionId = optimisticSessionId || (params?.id as string)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const paginationAnchorRef = useRef<{ id: string; offset: number } | null>(
    null,
  )
  const clearAnchorTimeoutRef = useRef<number | null>(null)
  const paginationRestoreActiveRef = useRef(false)
  const { user, isSignedIn } = useAuthState()
  const ischatRoute = pathname?.startsWith('/chat')
  const isPendingTransition = searchParams?.get('pending') === 'true'
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [hasTriggeredInitialScroll, setHasTriggeredInitialScroll] =
    useState(false)
  const [childSessionId, setChildSessionId] = useState<string | null>(null)
  const [isChildSidebarOpen, setIsChildSidebarOpen] = useState(false)
  const [artifactSidebarId, setArtifactSidebarId] = useState<string | null>(
    null,
  )
  const [isArtifactSidebarOpen, setIsArtifactSidebarOpen] = useState(false)
  const [showModeratorMessages, setShowModeratorMessages] = useState(false)
  const [isUserTranscribing, setIsUserTranscribing] = useState(false)
  const queryClient = useQueryClient()
  const { mutateAsync: updateUserPreferences } = useUpdateUserPreferences()
  const lastSyncedSessionIdRef = useRef<string | null>(null)

  // Track session viewing for notifications (only when signed in)
  useSessionTracking(isSignedIn ? sessionId : undefined)

  // Get optimistic notification clearing function
  const { markSessionAsRead } = useSessionNotificationsQuery()

  // Track the current session ID for live audio (handles session creation)
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId)

  // Update currentSessionId when sessionId prop changes
  useEffect(() => {
    setCurrentSessionId(sessionId)
  }, [sessionId])

  // Mark notifications as read when session is loaded (optimistic update, only when signed in)
  useEffect(() => {
    if (isSignedIn && sessionId && sessionId !== 'new') {
      markSessionAsRead(sessionId).catch(err =>
        console.error('Failed to mark notifications as read:', err),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isSignedIn])

  // Mark notifications as read when page regains focus (optimistic update, only when signed in)
  useEffect(() => {
    if (!isSignedIn || !sessionId || sessionId === 'new') return

    const handleFocus = () => {
      markSessionAsRead(sessionId).catch(err =>
        console.error('Failed to mark notifications as read on focus:', err),
      )
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isSignedIn])

  // Error handling
  const { errors, addError, removeError, clearErrors } = useSessionErrors()

  // Use WebSocket updates for new messages
  useSessionWebSocket({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
    fetchOlderMessages,
    getPaginationData,
  } = useSessionQuery({
    sessionId: sessionId as string,
    enabled: !!sessionId && sessionId !== 'new',
  })

  const artifactsEnabled = !!sessionId && sessionId !== 'new'
  const { artifacts: sessionArtifacts } = useArtifactsV3ListQuery({
    sessionId: artifactsEnabled ? (sessionId as string) : undefined,
    enabled: artifactsEnabled,
  })

  // Show confetti when an automatic session with an outcome is loaded
  useSessionCompletionConfetti({
    session,
    isLoading: isSessionLoading,
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
  const isPublicSession = session?.extras?.is_public === true
  const isReadOnlySession = Boolean(
    session &&
      sessionId &&
      sessionId !== 'new' &&
      isPublicSession &&
      !canManageSession,
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
  const pendingSession = useMemo<SessionV2 | null>(() => {
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
    } as SessionV2
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

  const nonStreamingState = useNonStreamingState({
    sessionId,
    session,
    enabled: !!sessionId && sessionId !== 'new',
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

  const optimisticMessages = nonStreamingState.optimisticMessages

  useEffect(() => {
    if (!pendingMessage) return
    nonStreamingState.setWaitingForResponse(true)
  }, [
    pendingMessage,
    nonStreamingState,
    nonStreamingState.setWaitingForResponse,
  ])

  // Error handling function
  const handleError = useCallback(
    (error: string) => {
      nonStreamingState.clearResponseState()

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
    [addError, clearErrors, router, nonStreamingState],
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  const capturePaginationAnchor = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const messageElements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-message-id]'),
    )

    const firstVisible = messageElements.find(el => {
      const rect = el.getBoundingClientRect()
      return rect.bottom >= containerRect.top + 1
    })

    if (firstVisible?.dataset.messageId) {
      const offset =
        firstVisible.getBoundingClientRect().top - containerRect.top
      paginationAnchorRef.current = {
        id: firstVisible.dataset.messageId,
        offset,
      }
    } else {
      paginationAnchorRef.current = null
    }
  }, [])

  const restorePaginationAnchor = useCallback(() => {
    const container = messagesContainerRef.current
    const anchor = paginationAnchorRef.current
    if (!container || !anchor) return

    const anchorEl = container.querySelector<HTMLElement>(
      `[data-message-id="${anchor.id}"]`,
    )
    if (!anchorEl) return

    const containerTop = container.getBoundingClientRect().top
    const anchorTop = anchorEl.getBoundingClientRect().top
    const delta = anchorTop - containerTop - anchor.offset

    if (Math.abs(delta) > 1) {
      container.scrollTop += delta
    }
  }, [])

  const scheduleClearPaginationAnchor = useCallback(() => {
    if (clearAnchorTimeoutRef.current !== null) {
      window.clearTimeout(clearAnchorTimeoutRef.current)
    }

    clearAnchorTimeoutRef.current = window.setTimeout(() => {
      paginationAnchorRef.current = null
      paginationRestoreActiveRef.current = false
    }, 400)
  }, [])

  // Track previous message count to detect new messages vs older messages
  const previousMessageCountRef = useRef<number>(0)

  // Handle scroll to detect when user scrolls near top for reverse pagination
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !sessionId || sessionId === 'new') {
      return
    }

    const handleScroll = async () => {
      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight
      const distanceFromBottom =
        container.scrollHeight - scrollTop - clientHeight

      isNearBottomRef.current = distanceFromBottom < 200

      // Trigger when we're within 2 viewports from the top (aggressive pre-loading)
      const scrollThreshold = clientHeight * 2

      if (scrollTop < scrollThreshold && !isLoadingOlderMessages) {
        const paginationData = getPaginationData()

        if (paginationData?.hasMore) {
          setIsLoadingOlderMessages(true)
          paginationRestoreActiveRef.current = true
          capturePaginationAnchor()

          // Store current scroll position
          const previousScrollHeight = container.scrollHeight
          const previousScrollTop = container.scrollTop
          try {
            const result = await fetchOlderMessages()

            // Wait for DOM to update
            setTimeout(() => {
              if (result.messages.length > 0) {
                // Restore scroll position
                const newScrollHeight = container.scrollHeight
                const scrollDiff = newScrollHeight - previousScrollHeight
                container.scrollTop = previousScrollTop + scrollDiff
                restorePaginationAnchor()
              }
              scheduleClearPaginationAnchor()
            }, 0)
          } catch (error) {
            console.error(
              '[Message Pagination] Failed to load older messages:',
              error,
            )
            scheduleClearPaginationAnchor()
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
    capturePaginationAnchor,
    restorePaginationAnchor,
    scheduleClearPaginationAnchor,
  ])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleMediaLoad = () => {
      if (!paginationAnchorRef.current) return
      if (!paginationRestoreActiveRef.current) return
      requestAnimationFrame(() => {
        restorePaginationAnchor()
        scheduleClearPaginationAnchor()
      })
    }

    container.addEventListener('load', handleMediaLoad, true)
    return () => {
      container.removeEventListener('load', handleMediaLoad, true)
    }
  }, [restorePaginationAnchor, scheduleClearPaginationAnchor])

  // Unified scroll handling: initial scroll and new message scroll.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const currentMessageCount = displaySession?.messages?.length || 0
    const previousMessageCount = previousMessageCountRef.current
    const countIncreased = currentMessageCount > previousMessageCount

    if (!hasTriggeredInitialScroll && currentMessageCount > 0) {
      setHasTriggeredInitialScroll(true)
      // Delay to ensure DOM has rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
      previousMessageCountRef.current = currentMessageCount
      return
    }

    if (
      hasTriggeredInitialScroll &&
      countIncreased &&
      !isLoadingOlderMessages
    ) {
      if (isNearBottomRef.current) {
        scrollToBottom()
      }
      previousMessageCountRef.current = currentMessageCount
      return
    }

    previousMessageCountRef.current = currentMessageCount
  }, [
    displaySession?.messages,
    hasTriggeredInitialScroll,
    isLoadingOlderMessages,
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

      const agents = displaySession?.agents || session?.agents || []
      return agentIds.map(agentId => {
        const agent = agents.find(a => a._id === agentId)
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
    [displaySession?.agents, session?.agents],
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

    // Include optimistic messages but avoid duplicates
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
  }, [
    displaySession?.messages,
    sessionId,
    isSessionLoading,
    optimisticMessages,
    ischatRoute,
    triggerData,
    session?.context,
  ])

  const messageGroups = useMemo(
    () => groupConsecutiveMessages(filteredMessages),
    [filteredMessages],
  )

  const artifactCount = sessionArtifacts.length
  const artifactCountLabel = artifactCount > 9 ? '9+' : `${artifactCount}`

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

  const handleArtifactOpen = useCallback((artifactId: string) => {
    setArtifactSidebarId(artifactId)
    setIsArtifactSidebarOpen(true)
  }, [])

  const handleToggleArtifactSidebar = useCallback(() => {
    setIsArtifactSidebarOpen(prev => !prev)
  }, [])

  const handleCloseArtifactSidebar = useCallback(() => {
    setIsArtifactSidebarOpen(false)
  }, [])

  const setArtifactControls = sessionsLayoutContext?.setArtifactControls

  useEffect(() => {
    if (!setArtifactControls) {
      return
    }

    if (!sessionId || sessionId === 'new') {
      setArtifactControls({
        count: 0,
        label: '0',
        isOpen: false,
      })
      return
    }

    setArtifactControls({
      count: artifactCount,
      label: artifactCountLabel,
      isOpen: isArtifactSidebarOpen,
      onToggle: handleToggleArtifactSidebar,
    })
  }, [
    artifactCount,
    artifactCountLabel,
    handleToggleArtifactSidebar,
    isArtifactSidebarOpen,
    sessionId,
    setArtifactControls,
  ])

  useEffect(() => {
    if (!isArtifactSidebarOpen) return
    if (artifactSidebarId) return
    if (sessionArtifacts.length === 0) return
    setArtifactSidebarId(sessionArtifacts[0]._id)
  }, [artifactSidebarId, isArtifactSidebarOpen, sessionArtifacts])

  useEffect(() => {
    setIsArtifactSidebarOpen(false)
    setArtifactSidebarId(null)
  }, [sessionId])

  // Enrich message sender with data from session.agents if sender is incomplete
  const enrichMessageSender = useCallback(
    (message: Message): Message => {
      if (!displaySession?.agents || displaySession.agents.length === 0) {
        return message
      }

      // If sender already has username and userImage, no need to enrich
      if (message.sender?.username && message.sender?.userImage) {
        // Still check if this is the moderator agent (username "eden")
        const isModerator = message.sender.username?.toLowerCase() === 'eden'
        if (isModerator) {
          return {
            ...message,
            sender: {
              ...message.sender,
              name: 'Moderator',
            },
          }
        }
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

      // Check if this is the moderator agent (username "eden")
      const senderUsername = message.sender?.username || matchingAgent.username
      const isModerator = senderUsername?.toLowerCase() === 'eden'

      // Merge sender with agent data (sender data takes precedence if present)
      return {
        ...message,
        sender: {
          _id: message.sender?._id || matchingAgent._id,
          username: senderUsername,
          name: isModerator
            ? 'Moderator'
            : message.sender?.name || matchingAgent.name,
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

  if (shouldShowLoadingSpinner) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <LoadingIndicator className="w-10 h-10 text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
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
          style={{ overflowAnchor: 'none' }}
        >
          {/* Floating controls - Agent Workspaces + Moderator + Conductor toggle - desktop only */}
          <div className="hidden md:block sticky top-2 z-20 ml-auto mr-4 w-fit space-y-2">
            {session?.agent_sessions &&
              Object.keys(session.agent_sessions).length > 0 && (
                <AgentWorkspaces
                  agents={session.agents || []}
                  agentSessions={session.agent_sessions}
                  onOpenWorkspace={handleChildSessionClick}
                />
              )}
            {/* View Moderator - only show for automatic sessions with moderator_session */}
            {session?.moderator_session && (
              <ViewModerator
                moderatorSessionId={session.moderator_session}
                onOpenModerator={handleChildSessionClick}
              />
            )}
            {/* Moderator messages toggle - only show for automatic sessions */}
            {session?.session_type === 'automatic' && (
              <button
                onClick={() => setShowModeratorMessages(!showModeratorMessages)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full',
                  'text-sm font-medium transition-colors',
                  'border border-blue-500/30',
                  showModeratorMessages
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-600/10',
                )}
              >
                <BrainIcon className="w-4 h-4" />
                <span className="hidden sm:inline">View Moderator</span>
              </button>
            )}
          </div>
          <div
            className="p-4 pb-8 max-w-[51rem] mx-auto w-full"
            style={{ overflowAnchor: 'none' }}
          >
            {/* Mobile-only controls - Agent Workspaces + Moderator + Conductor toggle */}
            {((session?.agent_sessions &&
              Object.keys(session.agent_sessions).length > 0) ||
              session?.moderator_session ||
              session?.session_type === 'automatic') && (
              <div className="md:hidden flex flex-wrap gap-2 mb-4">
                {session?.agent_sessions &&
                  Object.keys(session.agent_sessions).length > 0 && (
                    <AgentWorkspaces
                      agents={session.agents || []}
                      agentSessions={session.agent_sessions}
                      onOpenWorkspace={handleChildSessionClick}
                      label="Workspaces"
                      alwaysShowLabel
                    />
                  )}
                {/* View Moderator - mobile */}
                {session?.moderator_session && (
                  <ViewModerator
                    moderatorSessionId={session.moderator_session}
                    onOpenModerator={handleChildSessionClick}
                  />
                )}
                {session?.session_type === 'automatic' && (
                  <button
                    onClick={() =>
                      setShowModeratorMessages(!showModeratorMessages)
                    }
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full',
                      'text-sm font-medium transition-colors',
                      'border border-blue-500/30',
                      showModeratorMessages
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-600/10',
                    )}
                  >
                    <BrainIcon className="w-4 h-4" />
                    <span>View Moderator</span>
                  </button>
                )}
              </div>
            )}

            {/* Load more button for older messages */}
            {!isLoadingOlderMessages && getPaginationData()?.hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={async () => {
                    setIsLoadingOlderMessages(true)
                    paginationRestoreActiveRef.current = true
                    capturePaginationAnchor()

                    const container = messagesContainerRef.current
                    if (!container) return

                    // Store current scroll position before loading
                    const previousScrollHeight = container.scrollHeight
                    const previousScrollTop = container.scrollTop

                    try {
                      const result = await fetchOlderMessages()

                      // Wait for DOM to update with new messages
                      setTimeout(() => {
                        if (result.messages.length > 0) {
                          const newScrollHeight = container.scrollHeight
                          const scrollDiff =
                            newScrollHeight - previousScrollHeight

                          container.scrollTop = previousScrollTop + scrollDiff
                          restorePaginationAnchor()
                        }
                        scheduleClearPaginationAnchor()
                      }, 150)

                      // Keep loading state true for a bit longer to let React update
                      setTimeout(() => setIsLoadingOlderMessages(false), 200)
                    } catch (error) {
                      scheduleClearPaginationAnchor()
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
            ) : messageGroups.length === 0 ? (
              displaySession?.agents && displaySession.agents.length > 0 ? (
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
            ) : (
              <SessionMessageGroups
                groups={messageGroups}
                sessionId={sessionId as string}
                session={displaySession}
                isChatRoute={ischatRoute ?? false}
                showModeratorMessages={showModeratorMessages}
                isOwnMessage={isOwnMessage}
                enrichMessageSender={enrichMessageSender}
                onChildSessionClick={handleChildSessionClick}
                onArtifactOpen={handleArtifactOpen}
              />
            )}

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

            {isReadOnlySession && (
              <div className="mt-12 mb-8 p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground text-center">
                This is a public conversation. You cannot interact with this
                session.
              </div>
            )}

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

            {/* Error Display */}
            <ErrorDisplay
              errors={errors}
              onDismiss={removeError}
              className="mb-4"
            />

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Child Session Sidebar - for viewing child sessions from tool results */}
        {childSessionId && (
          <ChildSessionSidebar
            sessionId={childSessionId}
            parentSessionId={sessionId}
            isOpen={isChildSidebarOpen}
            onClose={handleCloseChildSidebar}
          />
        )}

        <ArtifactSidebar
          artifactId={artifactSidebarId}
          artifacts={sessionArtifacts}
          isOpen={isArtifactSidebarOpen}
          onClose={handleCloseArtifactSidebar}
          onSelectArtifact={setArtifactSidebarId}
        />
      </div>

      {!isReadOnlySession && (
        <div className="flex-shrink-0 bg-background p-4 z-10 border-t border-gray-800">
          <div className="max-w-[51rem] mx-auto w-full space-y-4">
            {/* Automatic session controls - shown above message input for automatic sessions */}
            {session?.session_type === 'automatic' && canManageSession && (
              <AutomaticSessionControls
                session={session}
                onStatusChange={newStatus => {
                  // Update session in cache
                  if (session) {
                    session.status = newStatus
                  }
                }}
              />
            )}
            <MessageInput
              sessionId={currentSessionId as string}
              enableVoiceInput={true}
              onStreamingMessage={(content, attachments, thinking) => {
                clearErrors()

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
              }}
              onTranscribingChange={setIsUserTranscribing}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Session
