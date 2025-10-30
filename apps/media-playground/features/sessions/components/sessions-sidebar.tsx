'use client'

import { AgentAvatars } from './agent-avatars'
import { SessionShareButton } from './session-share-button'
import { SettingsSidebar } from './settings-sidebar'
import { ModeToggle } from '@/components/header/mode-toggle'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewMode } from '@/features/sessions/components/types'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useSessionNotificationsQuery } from '@/hooks/query/use-session-notifications-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag, SessionV2 } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  EditIcon,
  ImageIcon,
  MenuIcon,
  MoreHorizontal,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Share2,
  TrashIcon,
} from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

interface SessionListItemProps {
  id: string
  title: string
  isActive: boolean
  onItemClick?: () => void
  isFromTrigger?: boolean
  isChat?: boolean
  agentId?: string
  agents?: Array<{
    _id: string
    username: string
    userImage: string
    name?: string
  }>
  isPinned?: boolean
  onPinToggle?: (sessionId: string, pinned: boolean) => Promise<void>
  unreadCount?: number
  userId?: string
}

const SessionListItem: FC<SessionListItemProps> = ({
  id,
  title,
  isActive,
  onItemClick,
  isFromTrigger = false,
  isChat = false,
  agentId,
  agents = [],
  isPinned = false,
  onPinToggle,
  unreadCount = 0,
  userId: _userId, // Used in share dialog
}) => {
  const router = useRouter()
  const params = useParams()
  const {
    renameSession: renameSessionQuery,
    deleteSession: deleteSessionQuery,
  } = useSessionListQuery({
    enabled: false,
    agent_id: agentId,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [optimisticTitle, setOptimisticTitle] = useState(title)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch session data when share dialog is opened
  const { data: session, isLoading: isSessionLoading } = useSessionQuery({
    sessionId: id,
    enabled: isShareDialogOpen,
  })

  // Update optimistic title when title prop changes
  useEffect(() => {
    setOptimisticTitle(title)
  }, [title])

  const deleteSession = async (sessionId: string) => {
    const currentSessionId =
      (params?.id as string) || (params?.sessionId as string)
    const isCurrentSession = sessionId === currentSessionId

    try {
      setIsDeleting(true)

      // Optimistically remove from cache and redirect immediately
      await deleteSessionQuery(sessionId)

      // If deleting current session, redirect to new session
      if (isCurrentSession) {
        if (isChat && params?.agentId) {
          router.push(`/chat/${params.agentId}`, { scroll: false })
        } else {
          router.push('/sessions/new', { scroll: false })
        }
      }

      // Show immediate feedback
      toast.success('Session deleted', {
        description: 'Your session has been deleted.',
        dismissible: true,
        richColors: true,
      })

      // Make API call in the background
      await axios.delete(`/api/sessions/${sessionId}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete session', {
        description: 'Please try again later.',
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      if (!newTitle) {
        setIsEditing(false)
        return
      }

      const originalTitle = optimisticTitle

      try {
        setIsRenaming(true)

        // Optimistically update the title immediately
        setOptimisticTitle(newTitle)
        await renameSessionQuery(sessionId, newTitle)

        // Show immediate feedback
        toast.success('Session renamed', {
          description: 'Your session has been renamed.',
          dismissible: true,
          richColors: true,
        })

        // Make API call in the background
        await axios.patch(`/api/sessions/${sessionId}`, {
          title: newTitle,
        })
      } catch (error) {
        console.error(error)

        // Rollback optimistic update on error
        setOptimisticTitle(originalTitle)

        toast.error('Failed to rename session', {
          description: 'Please try again later.',
          dismissible: true,
          richColors: true,
        })
      } finally {
        setIsRenaming(false)
        setIsEditing(false)
      }
    },
    [optimisticTitle, renameSessionQuery],
  )

  const handleRenameSubmit = useCallback(
    async (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault()
      isSubmittingRef.current = true
      await renameSession(id, newTitle.trim())
    },
    [id, newTitle, renameSession],
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
        'group flex justify-between font-normal items-center gap-1 rounded-md transition-all mr-1 text-sm relative p-0.5 border',
        isActive
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground font-medium'
          : 'hover:text-foreground hover:bg-muted/50 border-transparent',
      )}
    >
      <div className="flex-grow min-w-0 pl-1.5 pr-1 py-1.5 flex items-stretch">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow min-w-0 text-foreground">
            <Input
              id="session-title-input"
              name="title"
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
              className="h-8 flex-grow px-1 py-0 text-base min-w-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 border-border [@supports(font-size:16px)]:text-sm"
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-foreground hover:text-foreground"
              onClick={handleRenameSubmit}
              onMouseDown={e => e.preventDefault()}
              disabled={isRenaming}
            >
              {isRenaming ? (
                <LoadingIndicator className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Save</span>
            </Button>
          </div>
        ) : (
          <button
            className={cn(
              'flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center gap-2',
              isActive ? 'text-primary-foreground' : 'text-foreground',
            )}
            onClick={onItemClick}
            disabled={isEditing}
          >
            {!isChat && agents.length > 0 && (
              <AgentAvatars agents={agents} className="shrink-0" />
            )}
            {isFromTrigger && !agents.length && (
              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden whitespace-nowrap text-ellipsis flex items-center gap-2">
                <span className="truncate">
                  {optimisticTitle || 'Untitled'}
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shrink-0">
                    {unreadCount}
                  </span>
                )}
              </div>
              {(agents.length > 2 || isFromTrigger) && (
                <div className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis flex items-center gap-1">
                  {isFromTrigger && <ClockIcon className="h-3 w-3 shrink-0" />}
                  {isFromTrigger && agents.length > 2 && <span>•</span>}
                  {agents.length > 2 && (
                    <span>
                      {agents.length > 3
                        ? `${agents.length} members`
                        : agents
                            .map(agent => agent.name || agent.username)
                            .join(', ')}
                    </span>
                  )}
                  {isFromTrigger && agents.length <= 2 && (
                    <span>Scheduled Task</span>
                  )}
                </div>
              )}
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoadingIndicator className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
              <span className="sr-only">Session Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Share menu item - always visible */}
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => {
                setIsShareDialogOpen(true)
              }}
              disabled={isDeleting}
            >
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={async () => {
                if (onPinToggle) {
                  try {
                    await onPinToggle(id, !isPinned)
                    toast.success(
                      isPinned ? 'Session unpinned' : 'Session pinned',
                      {
                        dismissible: true,
                        richColors: true,
                      },
                    )
                  } catch (error) {
                    toast.error('Failed to update pin status', {
                      dismissible: true,
                      richColors: true,
                    })
                  }
                }
              }}
              disabled={isDeleting}
            >
              {isPinned ? (
                <>
                  <PinOffIcon className="size-4" />
                  Unpin
                </>
              ) : (
                <>
                  <PinIcon className="size-4" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => {
                setIsEditing(true)
                setNewTitle(optimisticTitle || '')
              }}
              disabled={isDeleting}
            >
              <PencilIcon className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10"
              onSelect={e => {
                e.preventDefault()
                setPendingDeleteId(id)
                setShowDeleteDialog(true)
              }}
              disabled={isDeleting}
            >
              <TrashIcon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Share Dialog - render separately, controlled by state */}
      {isShareDialogOpen && (
        <>
          {isSessionLoading ? (
            // Show loading state while fetching session
            <div className="hidden">Loading...</div>
          ) : session ? (
            <SessionShareButton
              sessionId={id}
              messages={session.messages || []}
              isOwner={session.owner?._id === _userId}
              isPublic={session.extras?.is_public}
              className="hidden"
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            />
          ) : null}
        </>
      )}

      {/* Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-xs w-full">
            <div className="mb-4 text-base font-medium">
              Delete this session?
            </div>
            <div className="mb-6 text-sm text-muted-foreground">
              This action cannot be undone. Are you sure you want to delete this
              session?
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setPendingDeleteId(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (pendingDeleteId) {
                    await deleteSession(pendingDeleteId)
                  }
                  setShowDeleteDialog(false)
                  setPendingDeleteId(null)
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <LoadingIndicator className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isNewSessionRoute(
  params: Record<string, string | string[]>,
  isChat?: boolean,
): boolean {
  // For chat: /chat/[agentId] (no sessionId)
  if (isChat) {
    return !!params.agentId && !params.sessionId && !params.id
  }
  // For sessions: /sessions/new
  return params.id === 'new' || (!params.sessionId && !params.id)
}

const TopLeft: FC<{
  onItemClick?: () => void
  isChat?: boolean
  onViewModeChange?: (mode: 'chat' | 'creations' | 'tasks' | 'settings') => void
  viewMode?: ViewMode
}> = ({ onItemClick, isChat, onViewModeChange, viewMode }) => {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.agentId as string
  const sessionId = params?.id as string
  const isNewSession = isNewSessionRoute(params || {}, isChat)

  // Hide button on /sessions/new in desktop view
  const shouldHideButton = !isChat && (sessionId === 'new' || !sessionId)

  const handleClick = () => {
    onItemClick?.()
    if (isChat && agentId) {
      // Switch to chat mode first, then navigate
      onViewModeChange?.('chat')
      router.push(`/chat/${agentId}`, { scroll: false })
    } else {
      router.push('/sessions/new', { scroll: false })
    }
  }

  // Don't render the button if we're on /sessions/new
  if (shouldHideButton) {
    return null
  }

  // Check if this button should be highlighted (in chat mode and on new session)
  const isActive = viewMode === 'chat' && isNewSession

  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      onClick={handleClick}
      className={cn(
        'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
        isActive
          ? 'bg-primary/20 hover:bg-primary/25 border-primary/40 text-primary-foreground'
          : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
      )}
    >
      <EditIcon className="size-4" />
      <span>{isChat ? 'New Chat' : 'New Session'}</span>
    </Button>
  )
}

// Agent selector and New Chat - two separate rows for mobile
const AgentSelectorAndNewChat: FC<{
  onItemClick?: () => void
  isChat?: boolean
  onViewModeChange?: (mode: 'chat' | 'creations' | 'tasks' | 'settings') => void
  agent?: Agent | null | undefined
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  userId?: string | null
  sessionId?: string
  session?: SessionV2
  viewMode?: ViewMode
  hasEditAccess?: boolean
}> = ({
  onItemClick,
  isChat,
  onViewModeChange,
  agent,
  onAgentSelect,
  userId,
  sessionId,
  session,
  viewMode,
  hasEditAccess,
}) => {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.agentId as string
  const isNewSession = isNewSessionRoute(params || {}, isChat)

  const handleNewChatClick = () => {
    onItemClick?.()
    if (isChat && agentId) {
      // Switch to chat mode first, then navigate
      onViewModeChange?.('chat')
      router.push(`/chat/${agentId}`, { scroll: false })
    } else {
      router.push('/sessions/new', { scroll: false })
    }
  }

  const handleAgentClick = () => {
    onItemClick?.()
    onAgentSelect?.()
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Row 1: Agent selector - full width */}
      <div className="flex gap-2 items-center">
        {/* Agent selector */}
        {agent && (
          <button
            onClick={handleAgentClick}
            className="flex items-center gap-2 hover:bg-muted/10 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] flex-1 min-w-0"
          >
            <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors flex-shrink-0">
              <AvatarImage
                src={
                  agent.userImage && agent.userImage.trim()
                    ? getCloudfrontOriginalUrl(agent.userImage)
                    : undefined
                }
                alt={agent.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-sm font-medium">
                {agent.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-base text-foreground truncate">
              {agent.username}
            </span>
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Row 2: Mode Toggle - only show if user has edit access */}
      {hasEditAccess && onViewModeChange && viewMode && (
        <ModeToggle
          mode={viewMode === 'settings' ? 'settings' : 'chat'}
          onModeChange={mode => {
            onViewModeChange(mode === 'settings' ? 'settings' : 'chat')
          }}
          variant="sidebar"
        />
      )}

      {/* Row 3: New Chat button - full width - hide in settings mode */}
      {viewMode !== 'settings' && (
        <Button
          variant={viewMode === 'chat' && isNewSession ? 'outline' : 'ghost'}
          onClick={handleNewChatClick}
          className={cn(
            'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
            viewMode === 'chat' && isNewSession
              ? 'bg-primary/20 text-primary-foreground border border-primary/40 hover:bg-primary/25'
              : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
          )}
        >
          <EditIcon className="size-4" />
          <span>{isChat ? 'New Chat' : 'New Session'}</span>
        </Button>
      )}

      {/* Row 4: Creations button - full width - hide in settings mode */}
      {viewMode && viewMode !== 'settings' && onViewModeChange && (
        <Button
          variant={viewMode === 'creations' ? 'outline' : 'ghost'}
          onClick={() => {
            onViewModeChange('creations')
            onItemClick?.()
          }}
          className={cn(
            'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
            viewMode === 'creations'
              ? 'bg-primary/20 hover:bg-primary/25 border-primary/40 text-primary-foreground'
              : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
          )}
        >
          <ImageIcon className="size-4" />
          <span>Creations</span>
        </Button>
      )}

      {/* Row 5: Share Chat button - only show when in chat mode and user owns the session */}
      {viewMode === 'chat' &&
        session &&
        sessionId &&
        session.owner?._id === userId && (
          <SessionShareButton
            sessionId={sessionId}
            messages={session.messages || []}
            isOwner={session.owner?._id === userId}
            isPublic={session.extras?.is_public}
            className="h-10 w-full justify-start hover:bg-muted/50 text-foreground"
          />
        )}
    </div>
  )
}

// Navigation buttons component for Creations
const NavigationButtons: FC<{
  onItemClick?: () => void
  agent: Agent | null | undefined
  userId?: string | null
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}> = ({ onItemClick, viewMode, onViewModeChange }) => {
  const handleNavClick = (mode: ViewMode) => {
    onViewModeChange(mode)
    onItemClick?.()
  }

  return (
    <Button
      variant={viewMode === 'creations' ? 'outline' : 'ghost'}
      onClick={() => handleNavClick('creations')}
      className={cn(
        'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
        viewMode === 'creations'
          ? 'bg-primary/20 hover:bg-primary/25 border-primary/40 text-primary-foreground'
          : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
      )}
    >
      <ImageIcon className="size-4" />
      <span>Creations</span>
    </Button>
  )
}

// Mobile sidebar header with navigation links
const MobileSidebarHeader: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const router = useRouter()

  const handleNavClick = (href: string) => {
    onItemClick?.()
    router.push(href)
  }

  return (
    <div className="mb-3 pb-3 border-b border-border pr-8 bg-background">
      {/* Eden logo + Navigation links in one row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <EdenLogoBw className="w-[28px]" />
          <span className="sr-only">Eden</span>
        </button>

        {/* Navigation links */}
        <nav className="flex items-center gap-4">
          <button
            onClick={() => handleNavClick('/chat')}
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Chat
          </button>
          <button
            onClick={() => handleNavClick('/explore?type=agents')}
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore
          </button>
          <button
            onClick={() => handleNavClick('/explore?type=tools')}
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </button>
        </nav>
      </div>
    </div>
  )
}

const MainLeft = ({
  onItemClick,
  agentId,
  isChat,
  onViewModeChange,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
  onViewModeChange?: (mode: 'chat' | 'creations' | 'tasks' | 'settings') => void
}) => {
  const { isSignedIn, verifyAuth, user } = useAuthState()
  const router = useRouter()
  const params = useParams()
  const currentSessionId =
    (params?.id as string) || (params?.sessionId as string)
  const {
    isLoading,
    hasMore,
    isFetchingNextPage,
    fetchNextPage,
    sessions,
    updatePinStatus,
  } = useSessionListQuery({
    enabled: !!isSignedIn,
    agent_id: agentId,
  })

  // Get unread notification counts for sessions
  const { data: unreadCounts } = useSessionNotificationsQuery()

  const handlePinToggle = async (sessionId: string, pinned: boolean) => {
    try {
      // Optimistically update the UI
      await updatePinStatus(sessionId, pinned)
      // Make the API call - using the same path as rename
      await axios.patch(`/api/sessions/${sessionId}`, { pinned })
    } catch (error) {
      console.error('Failed to update pin status:', error)
      // Revert the optimistic update on error
      await updatePinStatus(sessionId, !pinned)
      throw error
    }
  }

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isFetchingNextPage) {
      return
    }

    const target = document.getElementById('session-list-observer-target')
    if (!target) {
      return
    }

    const container = target.closest('nav')
    if (!container) {
      return
    }

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
      {
        root: container,
        threshold: 0,
        rootMargin: '100px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage, sessions.length])

  // Auto-fetch more sessions if container doesn't have scroll after filtering
  useEffect(() => {
    if (isLoading || isFetchingNextPage || !hasMore) {
      return
    }

    const container = document.querySelector(
      'nav.flex.flex-col.items-stretch.gap-1.overflow-y-auto.flex-1',
    ) as HTMLElement
    if (!container) {
      return
    }

    // Check if container has scroll
    const hasScroll = container.scrollHeight > container.clientHeight

    if (!hasScroll && hasMore) {
      // No scroll and more data available - fetch next page
      fetchNextPage()
    }
  }, [isLoading, isFetchingNextPage, hasMore, fetchNextPage, sessions.length])

  // Separate pinned and unpinned sessions
  const filteredSessions = sessions.filter(
    (session): session is NonNullable<typeof session> =>
      session != null &&
      // For chat mode, only show sessions with one agent or less
      (!isChat || !session.agents || session.agents.length <= 1),
  )

  const pinnedSessions = filteredSessions
    .filter(session => session.pinned === true)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )

  const unpinnedSessions = filteredSessions
    .filter(session => !session.pinned)
    .sort((a, b) => {
      // Sort by updatedAt only
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  return (
    <div className="flex flex-col text-sm font-medium flex-1 min-h-0 mr-1">
      {/* Scrollable session list */}
      <nav className="flex flex-col items-stretch gap-1 overflow-y-auto flex-1">
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
                {/* Pinned section */}
                {pinnedSessions.length > 0 && (
                  <>
                    <div className="sticky top-0 z-10 pb-1 mb-1 bg-accent">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <PinIcon className="h-3 w-3" />
                        Pinned
                      </div>
                    </div>
                    {pinnedSessions.map(session => (
                      <SessionListItem
                        key={session._id}
                        id={session._id}
                        title={
                          session.title ||
                          (session.trigger ? 'Scheduled Task' : 'Untitled')
                        }
                        isActive={session._id === currentSessionId}
                        isFromTrigger={!!session.trigger}
                        isChat={isChat}
                        agentId={agentId}
                        agents={session.agents}
                        isPinned={true}
                        onPinToggle={handlePinToggle}
                        unreadCount={unreadCounts?.get(session._id) || 0}
                        userId={user?._id}
                        onItemClick={() => {
                          onItemClick?.()
                          if (isChat && agentId) {
                            // Switch to chat mode first, then navigate to session
                            onViewModeChange?.('chat')
                            router.push(`/chat/${agentId}/${session._id}`, {
                              scroll: false,
                            })
                          } else {
                            // For regular sessions, go to /sessions/[sessionId]
                            router.push(`/sessions/${session._id}`, {
                              scroll: false,
                            })
                          }
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Recent section */}
                <div className="sticky top-0 z-10 pb-1 mb-1 bg-accent mr-2">
                  <div className="text-muted-foreground">Recent Sessions</div>
                </div>
                {unpinnedSessions.map(session => (
                  <SessionListItem
                    key={session._id}
                    id={session._id}
                    title={
                      session.title ||
                      (session.trigger ? 'Scheduled Task' : 'Untitled')
                    }
                    isActive={session._id === currentSessionId}
                    isFromTrigger={!!session.trigger}
                    isChat={isChat}
                    agentId={agentId}
                    agents={session.agents}
                    isPinned={false}
                    onPinToggle={handlePinToggle}
                    unreadCount={unreadCounts?.get(session._id) || 0}
                    userId={user?._id}
                    onItemClick={() => {
                      onItemClick?.()
                      if (isChat && agentId) {
                        // Switch to chat mode first, then navigate to session
                        onViewModeChange?.('chat')
                        router.push(`/chat/${agentId}/${session._id}`, {
                          scroll: false,
                        })
                      } else {
                        // For regular sessions, go to /sessions/[sessionId]
                        router.push(`/sessions/${session._id}`, {
                          scroll: false,
                        })
                      }
                    }}
                  />
                ))}
                {/* Observer target for infinite scrolling */}
                <div id="session-list-observer-target" className="h-1"></div>
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
    </div>
  )
}

export const SessionsSidebarContent = ({
  onItemClick,
  agentId,
  isChat,
  agent,
  userId,
  viewMode,
  onViewModeChange,
  onAgentSelect,
  onSettingsClick,
  sessionId,
  session,
  onSidebarToggle,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
  agent?: Agent | null | undefined
  userId?: string | null
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  sessionId?: string
  session?: SessionV2
  onSidebarToggle?: () => void
}) => {
  const { user } = useAuthState()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isPreviewUser =
    user?.featureFlags?.includes(FeatureFlag.Preview) ?? false

  // Get permissions for settings sidebar
  const { isOriginalOwner, hasOwnerAccess, hasEditAccess } =
    useAgentPermissions(agent, user?._id)

  // Get active tab from URL for settings mode
  const activeSettingsTab = searchParams?.get('tab') || 'profile'

  const handleSettingsTabChange = (tab: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', 'settings')
    url.searchParams.set('tab', tab)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  // Show settings sidebar when in settings mode
  if (viewMode === 'settings' && agent) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Mobile sidebar header with navigation - only show in mobile sidebar */}
        <div className="md:hidden flex-shrink-0">
          <MobileSidebarHeader onItemClick={onItemClick} />
        </div>

        {/* Agent selector - mobile only */}
        <div className="mb-2 mr-2 md:hidden flex-shrink-0">
          <AgentSelectorAndNewChat
            onItemClick={onItemClick}
            isChat={isChat}
            onViewModeChange={onViewModeChange}
            agent={agent}
            onAgentSelect={onAgentSelect}
            onSettingsClick={onSettingsClick}
            userId={userId}
            sessionId={sessionId}
            session={session}
            viewMode={viewMode}
            hasEditAccess={hasEditAccess}
          />
        </div>

        {/* Desktop: Agent selector + Mode Toggle */}
        <div className="hidden md:flex mb-4 mr-2 flex-col gap-3 flex-shrink-0">
          {/* Agent selector - desktop only */}
          {agent && (
            <div className="flex items-center gap-1">
              {/* Hamburger icon to toggle sidebar */}
              {onSidebarToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSidebarToggle}
                  className="h-8 w-8 shrink-0 hover:bg-muted/20"
                  title="Toggle sidebar"
                >
                  <MenuIcon className="h-4 w-4" />
                </Button>
              )}
              <button
                onClick={onAgentSelect}
                className="flex items-center gap-2 hover:bg-muted/10 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] flex-1 min-w-0"
              >
                <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors flex-shrink-0">
                  <AvatarImage
                    src={
                      agent.userImage && agent.userImage.trim()
                        ? getCloudfrontOriginalUrl(agent.userImage)
                        : undefined
                    }
                    alt={agent.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {agent.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-base text-foreground truncate">
                  {agent.username}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
              </button>
            </div>
          )}

          {/* Mode Toggle - desktop only */}
          {hasEditAccess && onViewModeChange && (
            <ModeToggle
              mode="settings"
              onModeChange={mode => {
                onViewModeChange(mode === 'settings' ? 'settings' : 'chat')
              }}
              variant="sidebar"
            />
          )}
        </div>

        <div className="flex-1 min-h-0">
          <SettingsSidebar
            activeTab={activeSettingsTab}
            onTabChange={handleSettingsTabChange}
            isOriginalOwner={isOriginalOwner}
            hasOwnerAccess={hasOwnerAccess}
            hasEditAccess={hasEditAccess}
            isPreviewUser={isPreviewUser}
            onItemClick={onItemClick}
          />
        </div>
      </div>
    )
  }

  // Show regular chat sidebar for all other modes
  return (
    <>
      {/* Mobile sidebar header with navigation - only show in mobile sidebar */}
      <div className="md:hidden">
        <MobileSidebarHeader onItemClick={onItemClick} />
      </div>

      {/* Agent selector + New Chat two-column layout - mobile only */}
      <div className="mb-2 mr-2 md:hidden">
        <AgentSelectorAndNewChat
          onItemClick={onItemClick}
          isChat={isChat}
          onViewModeChange={onViewModeChange}
          agent={agent}
          onAgentSelect={onAgentSelect}
          onSettingsClick={onSettingsClick}
          userId={userId}
          sessionId={sessionId}
          session={session}
          viewMode={viewMode}
          hasEditAccess={hasEditAccess}
        />
      </div>

      {/* Desktop: Agent selector + ModeToggle + Action Buttons */}
      <div className="hidden md:flex mb-4 mr-2 flex-col gap-3">
        {/* Agent selector - desktop only */}
        {agent && (
          <div className="flex items-center gap-1">
            {/* Hamburger icon to toggle sidebar */}
            {onSidebarToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSidebarToggle}
                className="h-8 w-8 shrink-0 hover:bg-muted/20"
                title="Toggle sidebar"
              >
                <MenuIcon className="h-4 w-4" />
              </Button>
            )}
            <button
              onClick={onAgentSelect}
              className="flex items-center gap-2 hover:bg-muted/10 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] flex-1 min-w-0"
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors flex-shrink-0">
                <AvatarImage
                  src={
                    agent.userImage && agent.userImage.trim()
                      ? getCloudfrontOriginalUrl(agent.userImage)
                      : undefined
                  }
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-sm font-medium">
                  {agent.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-base text-foreground truncate">
                {agent.username}
              </span>
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
            </button>
          </div>
        )}

        {/* Mode Toggle - desktop only, show if user has edit access */}
        {hasEditAccess && viewMode && onViewModeChange && (
          <ModeToggle
            mode={viewMode === 'settings' ? 'settings' : 'chat'}
            onModeChange={mode => {
              onViewModeChange(mode === 'settings' ? 'settings' : 'chat')
            }}
            variant="sidebar"
          />
        )}

        {/* New Chat button */}
        <TopLeft
          onItemClick={onItemClick}
          isChat={isChat}
          onViewModeChange={onViewModeChange}
          viewMode={viewMode}
        />

        {/* Navigation buttons for Creations */}
        {agent && viewMode && onViewModeChange && (
          <NavigationButtons
            onItemClick={onItemClick}
            agent={agent}
            userId={userId}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
      </div>

      <MainLeft
        onItemClick={onItemClick}
        agentId={agentId}
        isChat={isChat}
        onViewModeChange={onViewModeChange}
      />
    </>
  )
}

export const SessionsSidebar = React.memo(
  ({
    onItemClick,
    agentId,
    isChat,
  }: {
    onItemClick?: () => void
    agentId?: string
    isChat?: boolean
  }) => {
    const [isSidebarCollapsed] = React.useState(false)
    return (
      <div
        className={cn(
          'hidden md:flex md:flex-col bg-accent border-r p-3 pr-0 transition-all duration-300 ease-in-out',
          'max-w-[320px]',
          isSidebarCollapsed && 'p-0 border-none',
        )}
      >
        {/* Render content only if not collapsed */}
        {!isSidebarCollapsed && (
          <SessionsSidebarContent
            onItemClick={onItemClick}
            agentId={agentId}
            isChat={isChat}
          />
        )}
      </div>
    )
  },
)
SessionsSidebar.displayName = 'SessionsSidebar'
