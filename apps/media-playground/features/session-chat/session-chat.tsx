'use client'

import AgentLink from '../agent/agent-link'
import { groupConsecutiveMessages } from '../sessions/utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { ErrorDisplay } from '@/features/sessions/components/error-display'
import { MessageInput } from '@/features/sessions/components/message-input'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SessionTopBar } from '@/features/sessions/components/session-top-bar'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentSessionListQuery } from '@/hooks/query/use-agent-session-list-query'
import { useSessionMessageMutation } from '@/hooks/query/use-session-message-mutation'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useSessionErrors } from '@/hooks/use-session-errors'
import { useSessionStream } from '@/hooks/use-session-stream'
import { useSessionWebSocket } from '@/hooks/use-session-websocket'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, SessionV2 } from '@edenlabs/eden-sdk'
import { ArrowDownIcon } from '@radix-ui/react-icons'
import axios from 'axios'
import {
  CheckIcon,
  ChevronRightIcon,
  EditIcon,
  MoreHorizontal,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

// Session Welcome Component (exactly like MyThreadWelcome)
const SessionWelcome: FC<{
  agent: Agent | null | undefined
  onSendMessage: (content: string) => void
  isLoading: boolean
  children?: React.ReactNode
}> = ({ agent, onSendMessage, isLoading, children }) => {
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

        {children}

        {suggestions.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex flex-row gap-2 flex-wrap justify-center">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className="text-sm hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 px-3 py-2"
                  onClick={() => onSendMessage(suggestion.prompt)}
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

// Session Messages Component (like Thread.Messages)
const SessionMessages: FC<{
  session: SessionV2
  sessionId: string
  streamingText: string
  isStreamingTokens: boolean
  hasReceivedTokens: boolean
  waitingForWebSocket: boolean
  streamingAgent: Agent | null
}> = ({
  session,
  sessionId,
  streamingText,
  isStreamingTokens,
  hasReceivedTokens,
  waitingForWebSocket,
  streamingAgent,
}) => {
  const { user } = useAuthState()

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

  return (
    <div className="max-w-[--aui-thread-max-width] mx-auto w-full py-4">
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
                    sessionId={sessionId}
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
        <div>
          <OtherMessage
            sessionId={sessionId}
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
              } as SessionV2['messages'][0]
            }
            showAvatar={true}
            isStreamingTokens={isStreamingTokens && !hasReceivedTokens}
          />
        </div>
      )}
    </div>
  )
}

// MySession Component (exactly like MyThread structure)
const MySession: FC<{
  sessionId?: string
  agentId: string
  agent: Agent | null | undefined
}> = ({ sessionId, agentId, agent }) => {
  const [isMounted, setIsMounted] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const isInitialLoadRef = useRef(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastSeenContentRef = useRef('')
  const lastMessagesLengthRef = useRef(0)

  // Session state (matching MyThread pattern)
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingTokens, setIsStreamingTokens] = useState(false)
  const [hasReceivedTokens, setHasReceivedTokens] = useState(false)
  const [waitingForWebSocket, setWaitingForWebSocket] = useState(false)
  const [streamingAgent, setStreamingAgent] = useState<Agent | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  // Error handling
  const { errors, addError, removeError, clearErrors } = useSessionErrors()

  const { data: currentSession, isLoading: sessionLoading } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId,
  })

  const sendMessageMutation = useSessionMessageMutation()

  // Use WebSocket for real-time updates
  useSessionWebSocket({
    sessionId: sessionId || '',
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Constants for scroll calculations (matching MyThread)
  const BOTTOM_THRESHOLD = 60
  const NEAR_BOTTOM_THRESHOLD = 1.2

  // Get messages for scroll tracking
  const messages = currentSession?.messages || []

  // Get a string representation of all complete assistant messages
  const assistantMessagesContent = messages
    .filter(m => m.role === 'assistant' && m.content && m.content.length > 0)
    .map(m => m.content)
    .join('')

  // Check if any messages are still being generated
  const hasGeneratingMessage = isStreamingTokens || waitingForWebSocket

  // Show welcome screen when no sessionId is present (matching MyThread logic)
  const showWelcomeScreen = !sessionId

  // Only show loading when we have a sessionId but no messages yet (matching MyThread)
  const showLoadingState = !showWelcomeScreen
    ? false
    : isMounted && Boolean(sessionId) && messages.length === 0

  // Mount effect (matching MyThread)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Clear streaming state when websocket delivers the real message
  useEffect(() => {
    if (
      waitingForWebSocket &&
      streamingMessageIdRef.current &&
      currentSession?.messages
    ) {
      const lastMessage =
        currentSession.messages[currentSession.messages.length - 1]
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
  }, [currentSession?.messages, waitingForWebSocket])

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

  // Set up streaming with error handling
  const { sendMessage: sendStreamingMessage } = useSessionStream({
    sessionId: sessionId || '',
    onToken: text => {
      setStreamingText(prev => prev + text)
      setIsStreamingTokens(true)
      setHasReceivedTokens(true)
    },
    onMessage: content => {
      setStreamingText(content)
      setIsStreamingTokens(false)
      setWaitingForWebSocket(true)
      streamingMessageIdRef.current = content

      setTimeout(() => {
        if (streamingMessageIdRef.current === content) {
          setHasReceivedTokens(false)
          setWaitingForWebSocket(false)
          streamingMessageIdRef.current = null
        }
      }, 2000)
    },
    onToolComplete: () => {
      setStreamingText('')
      setIsStreamingTokens(true)
      setHasReceivedTokens(false)
      setWaitingForWebSocket(false)
      streamingMessageIdRef.current = null
    },
    onError: handleStreamingError,
    onDone: () => {
      if (!waitingForWebSocket) {
        setIsStreamingTokens(false)
        setHasReceivedTokens(false)
      }
    },
    onAgentInfo: agent => {
      setStreamingAgent(agent as Agent)
    },
  })

  // Track scroll position and new messages (matching MyThread)
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = viewport
      const distanceFromBottom = Math.abs(
        scrollHeight - scrollTop - clientHeight,
      )

      const atBottom = distanceFromBottom < BOTTOM_THRESHOLD
      const nearBottom =
        distanceFromBottom < clientHeight * NEAR_BOTTOM_THRESHOLD

      setIsAtBottom(atBottom)
      setIsNearBottom(nearBottom)
      setIsScrolled(scrollTop > 100)

      if (atBottom && !hasGeneratingMessage) {
        setHasNewMessages(false)
        lastSeenContentRef.current = assistantMessagesContent
      }
    }

    viewport.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [assistantMessagesContent, hasGeneratingMessage])

  // Scroll to bottom helper (matching MyThread)
  const scrollToBottom = useCallback(() => {
    if (!viewportRef.current) return
    const viewport = viewportRef.current

    const performScroll = () => {
      requestAnimationFrame(() => {
        const extraPadding = 60
        const targetScroll =
          viewport.scrollHeight - viewport.clientHeight + extraPadding

        viewport.scrollTo({
          top: targetScroll,
          behavior: isInitialLoadRef.current ? 'instant' : 'smooth',
        })

        setTimeout(() => {
          if (
            viewport.scrollTop + viewport.clientHeight <
            viewport.scrollHeight - BOTTOM_THRESHOLD
          ) {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: 'instant',
            })
          }
        }, 500)

        if (!hasGeneratingMessage) {
          setHasNewMessages(false)
          lastSeenContentRef.current = assistantMessagesContent
        }
      })
    }

    performScroll()
  }, [assistantMessagesContent, hasGeneratingMessage])

  // Auto-scroll when near bottom (matching MyThread)
  useEffect(() => {
    const hasNewMessage = messages.length > lastMessagesLengthRef.current
    const shouldAutoScroll =
      (isNearBottom || isInitialLoadRef.current) &&
      (hasNewMessage || hasGeneratingMessage)

    if (shouldAutoScroll) {
      scrollToBottom()
    }

    lastMessagesLengthRef.current = messages.length
  }, [messages, hasGeneratingMessage, scrollToBottom, isNearBottom])

  // Track new messages (matching MyThread)
  useEffect(() => {
    if (
      !isAtBottom &&
      assistantMessagesContent !== lastSeenContentRef.current &&
      !isInitialLoadRef.current &&
      !hasGeneratingMessage
    ) {
      setHasNewMessages(true)
    }
  }, [assistantMessagesContent, isAtBottom, hasGeneratingMessage])

  // Scroll to bottom on initial load (matching MyThread)
  useEffect(() => {
    if (!viewportRef.current || !isInitialLoadRef.current || !messages.length)
      return

    requestAnimationFrame(() => {
      if (viewportRef.current) {
        scrollToBottom()
        isInitialLoadRef.current = false
        lastSeenContentRef.current = assistantMessagesContent
      }
    })
  }, [messages.length, assistantMessagesContent, scrollToBottom])

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    try {
      clearErrors()

      if (sessionId && sessionId !== 'new') {
        // Use streaming for existing sessions
        setIsStreamingTokens(true)
        setHasReceivedTokens(false)
        setStreamingText('')
        setStreamingAgent(null)
        sendStreamingMessage(content, attachments)
      } else {
        // Create new session for first message
        const result = await sendMessageMutation.mutateAsync({
          content,
          attachments,
          agent_ids: [agentId],
          title: content.length > 50 ? content.slice(0, 50) + '...' : content,
        })

        if ('session_id' in result && result.session_id) {
          // This would need to be handled by parent component
          console.log('New session created:', result.session_id)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      handleStreamingError('Failed to send message')
    }
  }

  // Memoized composer (matching MyThread pattern)
  const memoizedComposer = React.useMemo(
    () => (
      <MessageInput
        sessionId={sessionId || 'new'}
        onStreamingMessage={handleSendMessage}
      />
    ),
    [sessionId, handleSendMessage],
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto pt-0 px-1 md:px-2 relative"
      >
        {showLoadingState ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
            <LoadingIndicator className="w-12 h-12" />
          </div>
        ) : (
          <>
            {showWelcomeScreen && (
              <SessionWelcome
                agent={agent}
                onSendMessage={handleSendMessage}
                isLoading={
                  sendMessageMutation.isPending ||
                  isStreamingTokens ||
                  sessionLoading
                }
              >
                {memoizedComposer}
              </SessionWelcome>
            )}

            {currentSession && sessionId && (
              <>
                {/* Session Top Bar */}
                {currentSession.agents && currentSession.agents.length > 0 && (
                  <SessionTopBar
                    agents={currentSession.agents}
                    title={currentSession.title}
                    sessionBudget={currentSession.budget}
                  />
                )}

                <SessionMessages
                  session={currentSession}
                  sessionId={sessionId}
                  streamingText={streamingText}
                  isStreamingTokens={isStreamingTokens}
                  hasReceivedTokens={hasReceivedTokens}
                  waitingForWebSocket={waitingForWebSocket}
                  streamingAgent={streamingAgent}
                />
              </>
            )}
          </>
        )}

        <ErrorDisplay
          errors={errors}
          onDismiss={removeError}
          className="mb-4 max-w-[--aui-thread-max-width] mx-auto"
        />
      </div>

      {/* Footer with scroll button and composer (matching MyThread) */}
      <div className="relative">
        {/* Show button only when NOT initial load AND NOT at bottom AND (scrolled up OR has new messages) */}
        {!isInitialLoadRef.current &&
          !isAtBottom &&
          (isScrolled || hasNewMessages) && (
            <Button
              variant="outline"
              onClick={scrollToBottom}
              className="absolute bottom-2 w-7 h-7 p-0 rounded-full hover:bg-accent flex items-center justify-center z-10"
            >
              <ArrowDownIcon className="w-5 h-5" />
              {hasNewMessages && (
                <div
                  onClick={scrollToBottom}
                  className="absolute right-8 text-xs text-accent-foreground bg-purple-950 border border-purple-600 px-2 py-1 rounded-md cursor-pointer hover:bg-purple-700"
                >
                  <span className="text-xs animate-pulse">New messages</span>
                </div>
              )}
            </Button>
          )}

        {!showWelcomeScreen && (
          <div className="max-w-[--aui-thread-max-width] mx-auto w-full">
            {memoizedComposer}
          </div>
        )}
      </div>
    </div>
  )
}

// Top Left - New Session Button
const TopLeft: FC<{
  onItemClick?: () => void
  onNewSession: () => void
}> = ({ onItemClick, onNewSession }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => {
        onNewSession()
        onItemClick?.()
      }}
      className="flex w-full justify-between px-3 mb-1"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>New Session</span>
      </div>
      <EditIcon className="size-4" />
    </Button>
  )
}

// Session List Item
type SessionListItemProps = {
  session: SessionV2
  currentSessionId?: string
  agentId: string
  onItemClick?: () => void
  onSessionSelect: (sessionId: string) => void
}

const SessionListItem: FC<SessionListItemProps> = ({
  session,
  currentSessionId,
  agentId,
  onItemClick,
  onSessionSelect,
}) => {
  const { invalidate } = useAgentSessionListQuery({
    agentId,
    enabled: false,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const isSubmittingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isActive = session._id === currentSessionId

  const deleteSession = async (sessionId: string) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`)
      await invalidate()
      toast.success('Session deleted')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete session')
    }
  }

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      if (!title) {
        setIsEditing(false)
        return
      }
      try {
        setIsRenaming(true)
        await axios.patch(`/api/sessions/${sessionId}`, { title })
        await invalidate()
        toast.success('Session renamed')
      } catch (error) {
        console.error(error)
        toast.error('Failed to rename session')
      } finally {
        setIsRenaming(false)
        setIsEditing(false)
      }
    },
    [invalidate],
  )

  const handleRenameSubmit = useCallback(
    async (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault()
      isSubmittingRef.current = true
      await renameSession(session._id, newTitle.trim())
    },
    [session._id, newTitle, renameSession],
  )

  const handleRenameCancel = useCallback(() => {
    if (!isSubmittingRef.current) {
      setIsEditing(false)
      setNewTitle('')
    }
    setTimeout(() => {
      isSubmittingRef.current = false
    }, 150)
  }, [])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      isSubmittingRef.current = false
    }
  }, [isEditing])

  return (
    <div
      className={cn(
        'group flex justify-between hover:text-primary font-normal hover:bg-muted/50 items-center gap-1 rounded-lg transition-all mr-1 text-sm relative',
        isActive && 'bg-muted text-primary font-medium',
      )}
    >
      <div className="flex-grow min-w-0 pl-1.5 pr-1 py-1.5 flex items-stretch">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow min-w-0">
            <Input
              ref={inputRef}
              value={newTitle}
              disabled={isRenaming}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isRenaming) {
                  handleRenameSubmit(e)
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  handleRenameCancel()
                }
              }}
              onBlur={handleRenameCancel}
              className="h-8 flex-grow px-1 py-0 text-sm min-w-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 border-border"
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-primary hover:text-primary"
              onClick={handleRenameSubmit}
              onMouseDown={e => e.preventDefault()}
              disabled={isRenaming}
            >
              {isRenaming ? (
                <LoadingIndicator className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <button
            className="flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center"
            onClick={() => {
              onSessionSelect(session._id)
              onItemClick?.()
            }}
            disabled={isEditing}
          >
            <div className="overflow-hidden whitespace-nowrap text-ellipsis">
              {session.title || 'Untitled Session'}
            </div>
          </button>
        )}
      </div>

      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-7 w-7 mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => {
                setIsEditing(true)
                setNewTitle(session.title || '')
              }}
            >
              <PencilIcon className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10"
              onSelect={e => {
                e.preventDefault()
                deleteSession(session._id)
              }}
            >
              <TrashIcon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Main Left Sidebar
const MainLeft: FC<{
  agentId: string
  currentSessionId?: string
  onItemClick?: () => void
  onSessionSelect: (sessionId: string) => void
}> = ({ agentId, currentSessionId, onItemClick, onSessionSelect }) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const { sessions, isLoading, hasMore, isFetchingNextPage, fetchNextPage } =
    useAgentSessionListQuery({
      agentId,
      enabled: !!isSignedIn && !!agentId,
    })

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isFetchingNextPage) return

    const target = document.getElementById('session-list-observer-target')
    if (!target) return

    const container = target.closest('nav')
    if (!container) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          const scrollPosition = container.scrollTop
          fetchNextPage().then(() => {
            requestAnimationFrame(() => {
              container.scrollTop = scrollPosition
            })
          })
        }
      },
      { threshold: 1.0, rootMargin: '10px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isFetchingNextPage, fetchNextPage])

  return (
    <nav className="flex flex-col items-stretch gap-1 text-sm font-medium overflow-y-auto">
      <div className="mb-1 text-muted-foreground">Recent</div>
      {isLoading ? (
        <>
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
        </>
      ) : (
        <>
          {isSignedIn ? (
            <>
              {sessions.filter(Boolean).map(session => (
                <SessionListItem
                  key={session._id}
                  session={session}
                  currentSessionId={currentSessionId}
                  agentId={agentId}
                  onItemClick={onItemClick}
                  onSessionSelect={onSessionSelect}
                />
              ))}
              {hasMore && (
                <div id="session-list-observer-target" className="h-8 w-full">
                  <Separator orientation="horizontal" className="my-2" />
                  <div
                    className={cn(
                      'flex justify-center text-muted-foreground text-sm py-2',
                      isFetchingNextPage && 'text-purple-600',
                    )}
                  >
                    {isFetchingNextPage ? (
                      <LoadingIndicator className="w-4 h-4" />
                    ) : (
                      'Older Sessions'
                    )}
                  </div>
                  <Separator orientation="horizontal" className="my-2" />
                </div>
              )}
            </>
          ) : (
            <Button
              className="text-muted-foreground text-center"
              variant="link"
              onClick={verifyAuth}
            >
              Not signed in
            </Button>
          )}
        </>
      )}
    </nav>
  )
}

// Sidebar Content
const SessionChatSidebarContent: FC<{
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  agentId: string
  currentSessionId?: string
  onItemClick?: () => void
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}> = ({
  agent,
  isOwner,
  handleEditClick,
  agentId,
  currentSessionId,
  onItemClick,
  onSessionSelect,
  onNewSession,
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-2 ml-2">
        {agent ? (
          <>
            <AgentLink
              agent={agent}
              className={cn(
                isOwner ? 'max-w-[calc(100%-2.5rem)]' : 'max-w-full',
              )}
            />
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 size-8"
                onClick={handleEditClick}
              >
                <SettingsIcon className="size-4" />
              </Button>
            )}
          </>
        ) : (
          <Skeleton className="w-[120px] h-8" />
        )}
      </div>
      <Separator orientation="horizontal" className="my-2 mb-1" />
      <div className="border-b mb-2">
        <TopLeft onItemClick={onItemClick} onNewSession={onNewSession} />
      </div>
      <MainLeft
        agentId={agentId}
        currentSessionId={currentSessionId}
        onItemClick={onItemClick}
        onSessionSelect={onSessionSelect}
      />
    </>
  )
}

// Mobile Sheet
const LeftBarSheet: FC<{
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  agentId: string
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}> = ({
  agent,
  isOwner,
  handleEditClick,
  agentId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}) => {
  const [open, setOpen] = useState(false)
  const handleCloseSheet = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 md:hidden gap-1"
        >
          <ChevronRightIcon className={'size-4'} />
          View Sessions
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col max-h-full pt-10 px-3 bg-[#0e1421] border-r gap-0"
      >
        <SheetTitle className="sr-only">Session List</SheetTitle>
        <SessionChatSidebarContent
          agent={agent}
          isOwner={isOwner}
          handleEditClick={handleEditClick}
          agentId={agentId}
          currentSessionId={currentSessionId}
          onItemClick={handleCloseSheet}
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
        />
      </SheetContent>
    </Sheet>
  )
}

// Main Component (matches Chat structure exactly)
type Props = {
  agentId: string
  sessionId?: string
}

const SessionChat: FC<Props> = ({ agentId, sessionId: initialSessionId }) => {
  const dispatch = useAppDispatch()
  const [isMounted, setIsMounted] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    initialSessionId,
  )
  const { user } = useAuthState()

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
    invalidate: invalidateAgent,
  } = useAgentQuery({ key: agentId })

  // Mount effect (matching Chat)
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  const handleEditClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'update',
        agentId: agentId,
        onAction: async () => {
          await invalidateAgent()
        },
      }),
    )
  }

  const isOwner = useMemo(() => {
    return user?._id === agent?.owner._id
  }, [user, agent])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const handleNewSession = () => {
    setCurrentSessionId(undefined)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* Mobile Header */}
      <div className="bg-[#0e1421] border-b px-2 py-2 md:hidden flex items-center justify-between">
        <LeftBarSheet
          agent={agent}
          isOwner={isOwner}
          handleEditClick={handleEditClick}
          agentId={agentId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
        <div className="ml-auto flex items-center gap-2">
          {agent ? (
            <>
              <AgentLink
                agent={agent}
                className="max-w-[120px] xs:max-w-[300px]"
              />
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8"
                  onClick={handleEditClick}
                >
                  <SettingsIcon className="size-4" />
                </Button>
              )}
            </>
          ) : (
            <Skeleton className="w-[120px] h-8" />
          )}
        </div>
      </div>

      {/* Resizable Layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 !overflow-y-hidden"
        autoSaveId={`resizable-session-chat-layout-${agentId}`}
      >
        {/* Desktop Sidebar */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          className={cn(
            'hidden md:flex md:flex-col bg-[#0e1421] border-r p-3 pr-0 transition-all duration-300 ease-in-out max-w-[320px]',
            isSidebarCollapsed && 'p-0 border-none',
          )}
        >
          {!isSidebarCollapsed && (
            <SessionChatSidebarContent
              agent={agent}
              isOwner={isOwner}
              handleEditClick={handleEditClick}
              agentId={agentId}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
            />
          )}
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
        />

        {/* Main Content */}
        <ResizablePanel defaultSize={80} className="flex flex-col">
          <main className="bg-accent flex-1 overflow-hidden flex flex-col">
            {!agent ? (
              <div className="flex-1 flex justify-center items-center">
                <LoadingIndicator className="w-10 h-10 text-purple-600" />
              </div>
            ) : (
              <MySession
                sessionId={currentSessionId}
                agentId={agentId}
                agent={agent}
              />
            )}

            {agentError && (
              <div className="p-4">
                <AlertDestructive title="Error loading agent">
                  <AlertDescription>
                    {agentErrorDetails?.message}
                  </AlertDescription>
                </AlertDestructive>
              </div>
            )}
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default SessionChat
