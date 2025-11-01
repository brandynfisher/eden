'use client'

import { AgentAvatars } from './agent-avatars'
import { SessionShareButton } from './session-share-button'
import { SettingsSidebar } from './settings-sidebar'
import RedeemVoucherForm from '@/components/form/redeem-voucher-form'
import { ModeToggle } from '@/components/header/mode-toggle'
import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import DialogMenuItem from '@/components/modal/dialog-menu-item'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatar from '@/components/user/user-avatar'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { ViewMode } from '@/features/sessions/components/types'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useSessionNotificationsQuery } from '@/hooks/query/use-session-notifications-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { siteConfig } from '@/lib/config'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { subscriptionTierNameMap } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { useAuth, useClerk } from '@clerk/nextjs'
import {
  Agent,
  FeatureFlag,
  FeedAgentCursorArguments,
  SessionV2,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  ActivityIcon,
  BookmarkIcon,
  BotIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ComponentIcon,
  CreditCardIcon,
  EditIcon,
  ImageIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  MoreHorizontal,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  SettingsIcon,
  Share2,
  TicketIcon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
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
      <div className="flex-grow min-w-0 px-2 py-1.5 flex items-stretch">
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
            <div className="min-w-0 flex-1 flex items-center gap-2">
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
                    {isFromTrigger && (
                      <ClockIcon className="h-3 w-3 shrink-0" />
                    )}
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
              {isPinned && (
                <PinIcon className="h-3 w-3 text-muted-foreground shrink-0" />
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
  const routerHook = useRouter()
  const params = useParams()
  const agentId = params?.agentId as string
  const isNewSession = isNewSessionRoute(params || {}, isChat)
  const router = routerHook

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

      {/* Row 5: Explore button - full width - hide in settings mode */}
      {viewMode !== 'settings' && (
        <Button
          variant="ghost"
          onClick={() => {
            onItemClick?.()
            router.push('/explore?type=agents')
          }}
          className="flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10 !bg-muted/[0.25] hover:!bg-muted/50 text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Explore</span>
        </Button>
      )}

      {/* Row 6: Tools button - full width - hide in settings mode */}
      {viewMode !== 'settings' && (
        <Button
          variant="ghost"
          onClick={() => {
            onItemClick?.()
            router.push('/create')
          }}
          className="flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10 !bg-muted/[0.25] hover:!bg-muted/50 text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span>Tools</span>
        </Button>
      )}

      {/* Row 7: Share Chat button - only show when in chat mode and user owns the session */}
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

// Mobile sidebar header with just the logo
const MobileSidebarHeader: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const router = useRouter()

  return (
    <div className="mb-3">
      <button
        onClick={() => {
          onItemClick?.()
          router.push('/')
        }}
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <EdenLogoBw className="w-[28px]" />
        <span className="sr-only">Eden</span>
      </button>
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
  const [isSessionsCollapsed, setIsSessionsCollapsed] = useState(false)
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

  // Combine pinned and unpinned sessions with pinned first
  const allSessions = [...pinnedSessions, ...unpinnedSessions]

  return (
    <div className="flex flex-col text-sm font-medium flex-1 min-h-0 mr-2">
      {isLoading ? (
        <div className="flex flex-col items-stretch gap-1 pb-2">
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
        </div>
      ) : (
        <>
          {isSignedIn ? (
            <>
              {/* Sessions header - collapsible */}
              <button
                onClick={() => setIsSessionsCollapsed(!isSessionsCollapsed)}
                className="sticky top-0 z-10 pb-1 mb-1 bg-accent flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRightIcon
                  className={cn(
                    'h-3 w-3 transition-transform',
                    !isSessionsCollapsed && 'rotate-90',
                  )}
                />
                Sessions
              </button>

              {/* Scrollable session list */}
              {!isSessionsCollapsed && (
                <nav className="flex flex-col items-stretch gap-1 overflow-y-auto flex-1 pb-2">
                  {allSessions.map(session => (
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
                      isPinned={session.pinned === true}
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
                </nav>
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
    </div>
  )
}

// Agents section for sidebar
const AgentsSection = () => {
  const { user } = useAuthState()
  const router = useRouter()
  const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(false)
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)

  // Query for user's top 3 agents - filter by owner, sort by message count
  const query: FeedAgentCursorArguments = React.useMemo(
    () => ({
      limit: 3,
      ...(user?._id ? { owner: user._id } : {}),
      sort: ['stats.userMessageCount;-1'],
    }),
    [user?._id],
  )

  interface AgentPage {
    docs: Agent[]
    nextCursor?: string
  }

  const { data, isLoading } = useInfiniteQuery<AgentPage>({
    queryKey: ['feed', 'agents', 'sidebar-agents', query],
    queryFn: ({ pageParam }): Promise<AgentPage> => {
      const paginationRoute = createCursorPaginationRoute('/api/feed/agents', {
        ...query,
        cursor: (pageParam as string) || '',
        limit: 3,
      })
      return fetcher(paginationRoute)
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: '',
    enabled: !!user?._id,
  })

  // Get agents from pages
  const myAgents = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.docs || []).slice(0, 3) as Agent[]
  }, [data])

  if (!user || isLoading || myAgents.length === 0) return null

  return (
    <div className="mr-2 mb-6">
      {/* Agents header - collapsible */}
      <button
        onClick={() => setIsAgentsCollapsed(!isAgentsCollapsed)}
        className="sticky top-0 z-10 pb-1 mb-1 bg-accent flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ChevronRightIcon
          className={cn(
            'h-3 w-3 transition-transform',
            !isAgentsCollapsed && 'rotate-90',
          )}
        />
        Agents
      </button>

      {/* Agent list */}
      {!isAgentsCollapsed && (
        <div className="flex flex-col gap-1 mr-1">
          {myAgents.map(agent => (
            <button
              key={agent._id}
              onClick={() => router.push(`/chat/${agent.username}`)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage
                  src={
                    agent.userImage && agent.userImage.trim()
                      ? getCloudfrontOriginalUrl(agent.userImage)
                      : undefined
                  }
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-xs font-medium">
                  {agent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate flex-1 text-left">
                {agent.name}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setSettingsAgentId(agent.username)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Agent Settings Modal */}
      {settingsAgentId && (
        <AgentSettingsModal
          agentId={settingsAgentId}
          open={!!settingsAgentId}
          onOpenChange={open => !open && setSettingsAgentId(null)}
        />
      )}
    </div>
  )
}

// ThemeToggle wrapper for forwardRef
const ThemeToggleForwardWrap = React.forwardRef<HTMLDivElement>(
  ({ ...rest }, ref) => (
    <div ref={ref} className="w-full">
      <ThemeToggle {...rest} label={'Theme'} />
    </div>
  ),
)
ThemeToggleForwardWrap.displayName = 'ThemeToggleForwardWrap'

// User Profile component for sidebar bottom
const SidebarUserProfile = () => {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const { user, balance } = useMe({
    isAuthenticated: !!isSignedIn,
  })
  const { signOut } = useClerk()

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const logout = async () => {
    if (isSignedIn) {
      await signOut({ redirectUrl: pathname || '/' })
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasOpenDialog, setHasOpenDialog] = useState(false)
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null)
  const focusRef = useRef<HTMLButtonElement | null>(null)

  function handleDialogItemSelect() {
    focusRef.current = dropdownTriggerRef.current
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open)
    if (!open) {
      setDropdownOpen(false)
    }
  }

  if (!user) return null

  return (
    <div className="hidden md:block border-t bg-background">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            ref={dropdownTriggerRef}
            className="flex items-center gap-2 w-full p-3 hover:bg-muted/20 transition-colors"
          >
            <UserAvatar
              image={user?.userImage}
              name={user?.username}
              className="w-8 h-8"
            />
            <span className="text-sm font-medium truncate flex-1 text-left">
              {user?.username}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-60 mb-2"
          hidden={hasOpenDialog}
          onCloseAutoFocus={event => {
            if (focusRef.current) {
              (focusRef.current as HTMLButtonElement).focus()
              focusRef.current = null
              event.preventDefault()
            }
          }}
        >
          <DropdownMenuItem className="cursor-pointer group" asChild>
            <Link
              href={`/creators/${user?.username}`}
              className="group flex gap-2 items-center cursor-pointer "
            >
              <UserAvatar
                image={user?.userImage}
                name={user?.username}
                className="h-8 w-8"
              />
              <div className="flex flex-col justify-center min-w-0">
                <div className="group-hover:text-primary text-xs transition-colors">
                  {user?.username}
                </div>
                {user?.email ? (
                  <span className="text-xs text-muted-foreground/70 truncate">
                    {user?.email}
                  </span>
                ) : null}
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link
              href={'/settings/subscription'}
              className="flex items-center justify-between w-full"
            >
              <div className="capitalize text-xs">
                <span>
                  {
                    subscriptionTierNameMap[
                      user?.subscriptionTier || SubscriptionTier.Free
                    ]
                  }
                </span>
                <span className="ml-1 text-muted-foreground/70">plan</span>
              </div>
              <div className="text-xs">
                <span>
                  {Number((balance || 0).toFixed(0)).toLocaleString()}
                </span>
                <span className="ml-1 text-muted-foreground/70">manna</span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/creators/${user?.username}`}>
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Creations</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/creators/${user?.username}?tab=models`}>
              <ComponentIcon className="mr-2 h-4 w-4" />
              <span>Models</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/creators/${user?.username}?tab=collections`}>
              <BookmarkIcon className="mr-2 h-4 w-4" />
              <span>Collections</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/creators/${user?.username}?tab=agents`}>
              <BotIcon className="mr-2 h-4 w-4" />
              <span>Agents</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {isPreviewUser && (
            <>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/sessions">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  <span>Sessions</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={`/settings/tasks`}>
                  <ClockIcon className="mr-2 h-4 w-4" />
                  <span>Tasks</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={`/settings/integrations`}>
                  <ActivityIcon className="mr-2 h-4 w-4" />
                  <span>Integrations</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/settings/subscription`}>
              <CreditCardIcon className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </Link>
          </DropdownMenuItem>
          <DialogMenuItem
            onSelect={handleDialogItemSelect}
            onOpenChange={handleDialogItemOpenChange}
            triggerChildren={
              <>
                <TicketIcon className="mr-2 h-4 w-4" />
                <span>Redeem Voucher</span>
              </>
            }
          >
            <RedeemVoucherForm />
          </DialogMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={`/settings/account`}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <ThemeToggleForwardWrap />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={logout}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="pl-2">
            <div className="flex items-center w-full">
              <Link
                className="text-xs hover:underline text-muted-foreground"
                href={`https://docs.eden.art/legal/tos`}
                prefetch={false}
              >
                <span>Terms</span>
              </Link>

              <div className="ml-auto flex gap-1">
                <Button variant="ghost" size={'icon'} asChild>
                  <Link
                    href={siteConfig.links.discord}
                    target="_blank"
                    className="filter grayscale hover:grayscale-0"
                  >
                    <DiscordIcon size={20} />
                  </Link>
                </Button>
                <Button variant="ghost" size={'icon'} asChild>
                  <Link
                    href={siteConfig.links.twitter}
                    target="_blank"
                    className="group grayscale hover:grayscale-0 hover:text-white"
                  >
                    <TwitterIcon
                      size={18}
                      className="brightness-50 group-hover:!brightness-100"
                    />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
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
  isCollapsed = false,
  mode = 'sessions',
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
  isCollapsed?: boolean
  mode?: 'sessions' | 'explore' | 'create'
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

  // Show collapsed sidebar with icons only
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 h-full pt-2">
        {/* Expand button */}
        {onSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-9 w-9 shrink-0 hover:bg-muted/20 p-0"
            title="Expand sidebar"
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Eden logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center h-9 w-9 hover:bg-muted/20 rounded-md transition-colors"
          title="Home"
        >
          <EdenLogoBw className="w-[20px]" />
        </button>

        {/* Explore icon */}
        <button
          onClick={() => router.push('/explore?type=agents')}
          className="flex items-center justify-center h-9 w-9 hover:bg-muted/20 rounded-md transition-colors"
          title="Explore"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>

        {/* Tools icon */}
        <button
          onClick={() => router.push('/create')}
          className="flex items-center justify-center h-9 w-9 hover:bg-muted/20 rounded-md transition-colors"
          title="Tools"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </button>

        {/* Spacer to push profile to bottom */}
        <div className="flex-1" />

        {/* User Profile icon at bottom */}
        {user && (
          <button
            onClick={() => router.push(`/creators/${user.username}`)}
            className="flex items-center justify-center h-9 w-9 hover:bg-muted/20 rounded-md transition-colors mb-2"
            title={user.username}
          >
            <UserAvatar
              image={user.userImage}
              name={user.username}
              className="w-7 h-7"
            />
          </button>
        )}
      </div>
    )
  }

  // Show settings sidebar when in settings mode
  if (viewMode === 'settings' && agent) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Desktop: Eden logo + close button at the top */}
        <div className="hidden md:flex items-center justify-between mb-4 mr-2 pt-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <EdenLogoBw className="w-[28px]" />
          </button>
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="h-8 w-8 shrink-0 hover:bg-muted/20"
              title="Close sidebar"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

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
            <button
              onClick={onAgentSelect}
              className="flex items-center gap-2 hover:bg-muted/10 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02]"
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
    <div className="flex flex-col h-full">
      {/* Desktop: Eden logo + close button at the top */}
      <div className="hidden md:flex items-center justify-between mb-4 mr-2 pt-3">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <EdenLogoBw className="w-[28px]" />
        </button>
        {onSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-8 w-8 shrink-0 hover:bg-muted/20"
            title="Close sidebar"
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile sidebar header with navigation - only show in mobile sidebar */}
      <div className="md:hidden">
        <MobileSidebarHeader onItemClick={onItemClick} />
      </div>

      {/* Agent selector + New Chat two-column layout - mobile only */}
      {mode === 'sessions' && (
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
      )}

      {/* Desktop: Navigation Buttons */}
      <div className="hidden md:flex mb-4 mr-2 flex-col gap-2">
        {/* Explore button */}
        <Button
          variant="ghost"
          onClick={() => {
            onItemClick?.()
            router.push('/explore?type=agents')
          }}
          className={cn(
            'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
            mode === 'explore'
              ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
              : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Explore</span>
        </Button>

        {/* Tools button */}
        <Button
          variant="ghost"
          onClick={() => {
            onItemClick?.()
            router.push('/create')
          }}
          className={cn(
            'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
            mode === 'create'
              ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
              : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span>Tools</span>
        </Button>
      </div>

      {/* Content area based on mode */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {mode === 'sessions' && (
          <>
            <AgentsSection />
            <MainLeft
              onItemClick={onItemClick}
              agentId={agentId}
              isChat={isChat}
              onViewModeChange={onViewModeChange}
            />
          </>
        )}

        {mode === 'explore' && (
          <div className="hidden md:flex flex-col gap-2 mr-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Browse
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/explore?type=agents')}
              className={cn(
                'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
                searchParams?.get('type') === 'agents'
                  ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
                  : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
              )}
            >
              Agents
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/explore?type=models')}
              className={cn(
                'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
                searchParams?.get('type') === 'models'
                  ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
                  : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
              )}
            >
              Models
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/explore?type=creations')}
              className={cn(
                'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
                searchParams?.get('type') === 'creations'
                  ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
                  : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
              )}
            >
              Creations
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/explore?type=tools')}
              className={cn(
                'flex w-full justify-start gap-2 rounded-md font-medium transition-colors h-10',
                searchParams?.get('type') === 'tools'
                  ? 'bg-primary/20 hover:bg-primary/25 border border-primary/40 text-primary-foreground'
                  : '!bg-muted/[0.25] hover:!bg-muted/50 text-foreground',
              )}
            >
              Tools
            </Button>
          </div>
        )}
      </div>

      {/* User Profile Section - Bottom of sidebar */}
      <SidebarUserProfile />
    </div>
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
