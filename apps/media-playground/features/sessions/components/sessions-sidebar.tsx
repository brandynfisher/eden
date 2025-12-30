'use client'

import { AgentAvatars } from './agent-avatars'
import { RecentAgents } from './recent-agents'
import { SessionShareButton } from './session-share-button'
import { SettingsSidebar } from './settings-sidebar'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import AccountMenuContent from '@/components/navigation/account-menu-content'
import NotificationDropdown from '@/components/notifications/notification-dropdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatar from '@/components/user/user-avatar'
import { UserSettingsModal } from '@/features/account/user-settings-modal'
import { ViewMode } from '@/features/sessions/components/types'
import AgentMemoryView from '@/features/sessions/views/agent-memory-view'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useSessionNotificationsQuery } from '@/hooks/query/use-session-notifications-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { useNativeWebview } from '@/hooks/use-native-webview'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { useNotificationContext } from '@/providers/notification-provider'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Agent, FeatureFlag, SessionPermissionLevel } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  MenuIcon,
  MoreHorizontal,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Share2,
  TrashIcon,
} from 'lucide-react'
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
  hideAvatars?: boolean
  ownerId?: string
  permissionLevel?: SessionPermissionLevel
  platform?: 'discord' | 'telegram' | 'twitter' | 'farcaster'
}

const PlatformIcon = ({
  platform,
}: {
  platform: 'discord' | 'telegram' | 'twitter' | 'farcaster'
}) => {
  switch (platform) {
    case 'discord':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#5865F2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg
          className="h-3.5 w-3.5 text-foreground shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'farcaster':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#8A63D2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 4h18v16.5h-2.25v-1.5H5.25v1.5H3V4zm2.25 2.25v9.75h13.5V6.25H5.25zm3 2.25h7.5v1.5h-7.5v-1.5zm0 3h7.5v1.5h-7.5v-1.5z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#0088cc] shrink-0"
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
  hideAvatars = false,
  ownerId,
  permissionLevel,
  platform,
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

  const isOwnerOfSession = ownerId && _userId && ownerId === _userId
  const canManageSession = !!isOwnerOfSession
  const permissionLabel =
    permissionLevel && permissionLevel !== SessionPermissionLevel.Owner
      ? `${permissionLevel.charAt(0).toUpperCase()}${permissionLevel.slice(1)}`
      : undefined

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
          router.push('/chat', { scroll: false })
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
        'group flex justify-between font-normal items-center gap-1 rounded-md transition-all mr-1 text-[15px] relative p-0.5 border',
        isActive
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground font-medium'
          : 'hover:text-foreground hover:bg-muted/50 border-transparent',
      )}
    >
      <div className="flex-grow min-w-0 px-1.5 py-1 flex items-stretch">
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
            {!hideAvatars && agents.length > 0 && (
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
                  {platform && <PlatformIcon platform={platform} />}
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shrink-0">
                      {unreadCount}
                    </span>
                  )}
                  {!canManageSession && permissionLabel && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium border border-border text-muted-foreground shrink-0">
                      {permissionLabel}
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
              disabled={!canManageSession || isDeleting}
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
            {!platform && (
              <DropdownMenuItem
                className="flex items-center gap-2"
                onSelect={() => {
                  setIsEditing(true)
                  setNewTitle(optimisticTitle || '')
                }}
                disabled={!canManageSession || isDeleting}
              >
                <PencilIcon className="size-4" />
                Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10"
              onSelect={e => {
                e.preventDefault()
                setPendingDeleteId(id)
                setShowDeleteDialog(true)
              }}
              disabled={!canManageSession || isDeleting}
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
  scrollContainerRef,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
  scrollContainerRef?: React.MutableRefObject<HTMLDivElement | null>
}) => {
  const { isSignedIn, user } = useAuthState()
  const router = useRouter()
  const params = useParams()
  const currentSessionId =
    (params?.id as string) || (params?.sessionId as string)

  // Track if component has mounted to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Always show "Recent Chats" label
  const sessionsLabel = 'Recent Chats'
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
    // Don't filter by agent - show all chats
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

  // Track fetching state with refs
  const isFetchingRef = useRef(isFetchingNextPage)
  const hasMoreRef = useRef(hasMore)

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage
    hasMoreRef.current = hasMore
  }, [isFetchingNextPage, hasMore])

  // Scroll-based pagination
  useEffect(() => {
    if (isSessionsCollapsed) {
      return
    }

    const container = scrollContainerRef?.current
    if (!container) {
      return
    }

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // Fetch when within 200px of bottom
      if (
        distanceFromBottom <= 200 &&
        hasMoreRef.current &&
        !isFetchingRef.current
      ) {
        fetchNextPage()
      }
    }

    container.addEventListener('scroll', handleScroll)
    // Run once in case we're already near the bottom on mount
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [fetchNextPage, scrollContainerRef, isLoading, isSessionsCollapsed])

  // Separate pinned and unpinned sessions - memoized to avoid recomputing on every render
  const allSessions = React.useMemo(() => {
    // Show ALL chats for all routes (no session_type filtering)
    // Visibility logic:
    // - visible === false → always hide
    // - visible === true → always show (overrides parent_session rule)
    // - visible is null/undefined → hide if has parent_session
    const filteredSessions = sessions.filter(
      (session): session is NonNullable<typeof session> => {
        if (!session) return false
        if (session.visible === false) return false
        if (session.visible === true) return true
        if (session.parent_session) return false
        return true
      },
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
    return [...pinnedSessions, ...unpinnedSessions]
  }, [sessions])

  // Show loading state until mounted and data is loaded
  const showLoading = !hasMounted || isLoading

  return (
    <div className="flex flex-col text-sm font-medium mr-2 min-h-0">
      {showLoading ? (
        <div className="flex flex-col items-stretch gap-1 pb-2">
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
        </div>
      ) : (
        <>
          {isSignedIn && (
            <>
              {/* Sessions header - collapsible */}
              <button
                onClick={() => setIsSessionsCollapsed(!isSessionsCollapsed)}
                className="pb-1 mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRightIcon
                  className={cn(
                    'h-3 w-3 transition-transform',
                    !isSessionsCollapsed && 'rotate-90',
                  )}
                />
                {sessionsLabel}
              </button>

              {/* Scrollable session list */}
              {!isSessionsCollapsed && (
                <nav className="flex flex-col items-stretch gap-1 pb-2">
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
                      ownerId={session.owner?._id}
                      permissionLevel={session.permission_level_for_user}
                      platform={session.platform}
                      hideAvatars={false}
                      onItemClick={() => {
                        onItemClick?.()
                        // Always navigate to /sessions/{session_id}
                        router.push(`/sessions/${session._id}`, {
                          scroll: false,
                        })
                      }}
                    />
                  ))}
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// User Profile component for sidebar bottom
const SidebarUserProfile = ({
  variant = 'default',
}: {
  variant?: 'default' | 'collapsed'
}) => {
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut, openSignIn } = useClerk()
  const pathname = usePathname()
  const { unreadCount } = useNotificationContext()

  const isNativeWebview = useNativeWebview()

  // Track if component has mounted to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const isAuthReady = isLoaded && hasMounted
  const shouldFetchMe = isAuthReady && !!isSignedIn

  const { user, balance, isLoading } = useMe({
    isAuthenticated: shouldFetchMe,
  })

  const verifyAuth = useCallback(async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn({
      appearance: { baseTheme: dark },
      forceRedirectUrl: pathname || '/',
    })
    return false
  }, [isSignedIn, openSignIn, pathname])

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const logout = async () => {
    if (isSignedIn) {
      await signOut()

      if (isNativeWebview) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'LOGOUT',
          }),
        )
      }

      window.location.href = '/'
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsModalInitialTab, setSettingsModalInitialTab] =
    useState('account')
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null)

  const openSettings = (tab = 'account') => {
    setSettingsModalInitialTab(tab)
    setSettingsModalOpen(true)
  }

  // Avoid rendering auth controls until auth state and user data have settled
  if (!isAuthReady || isLoading) {
    return (
      <div
        className={cn(
          'border-t bg-background flex-shrink-0',
          variant === 'collapsed'
            ? 'p-2 w-full flex justify-center'
            : 'p-3 md:-ml-2 md:w-[calc(100%+0.5rem)]',
        )}
      >
        <Skeleton
          className={cn(
            'h-10',
            variant === 'collapsed' ? 'w-10 rounded-full' : 'w-full rounded-md',
          )}
        />
      </div>
    )
  }

  // Show sign-in button when not signed in
  if (!isSignedIn || !user) {
    return (
      <div
        className={cn(
          'border-t bg-background flex-shrink-0',
          variant === 'collapsed'
            ? 'p-2 w-full flex justify-center'
            : 'p-3 md:-ml-2 md:w-[calc(100%+0.5rem)]',
        )}
      >
        <Button
          onClick={verifyAuth}
          className={variant === 'collapsed' ? 'w-10 h-10 p-0' : 'w-full'}
          variant="default"
        >
          Sign In
        </Button>
      </div>
    )
  }

  const dropdownContent = (
    <AccountMenuContent
      user={user ?? undefined}
      balance={balance}
      isPreviewUser={isPreviewUser}
      onLogout={logout}
      onOpenSettings={openSettings}
      setDropdownOpen={setDropdownOpen}
      triggerRef={dropdownTriggerRef}
      side={variant === 'collapsed' ? 'right' : 'top'}
      align={variant === 'collapsed' ? 'end' : 'start'}
    />
  )

  if (variant === 'collapsed') {
    return (
      <div className="border-t bg-background w-full flex justify-center py-2 flex-shrink-0">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              ref={dropdownTriggerRef}
              className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted/20 transition-colors"
            >
              <UserAvatar
                image={user?.userImage}
                name={user?.username}
                className="w-8 h-8"
              />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-background bg-destructive px-1 text-[11px] font-semibold leading-none text-white shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="border-t bg-background -ml-2 w-[calc(100%_+_0.5rem)] flex-shrink-0">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              ref={dropdownTriggerRef}
              className="flex items-center gap-3 flex-1 py-2 pr-3 pl-3 hover:bg-muted/20 transition-colors rounded-md text-left"
            >
              <UserAvatar
                image={user?.userImage}
                name={user?.username}
                className="w-8 h-8"
              />
              <div className="flex flex-col flex-1 min-w-0 text-left">
                <span className="text-sm font-medium truncate">
                  {user?.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Number((balance || 0).toFixed(0)).toLocaleString()} manna
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
        <div className="ml-auto">
          <NotificationDropdown />
        </div>
      </div>

      {/* User Settings Modal */}
      {settingsModalOpen && (
        <UserSettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          initialTab={settingsModalInitialTab}
        />
      )}
    </div>
  )
}

export const SessionsSidebarContent = ({
  onItemClick,
  agentId,
  isChat,
  agent,
  viewMode,
  onViewModeChange: _onViewModeChange, // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
  onAgentSelect,
  onSidebarToggle,
  isCollapsed = false,
  isMobileSidebar = false,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
  agent?: Agent | null | undefined
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onAgentSelect?: () => void
  onSidebarToggle?: () => void
  isCollapsed?: boolean
  isMobileSidebar?: boolean
}) => {
  const { user, isSignedIn } = useAuthState()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Track if component has mounted to avoid hydration mismatch
  const [hasMounted, setHasMounted] = React.useState(false)
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const isPreviewUser =
    user?.featureFlags?.includes(FeatureFlag.Preview) ?? false
  const sessionsScrollContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Get user preferences for last agent
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!isSignedIn })
  const lastAgent =
    lastAgents.length > 0 ? lastAgents[0].username || lastAgents[0]._id : 'eve'
  const agentUsername = agent?.username

  const handleNewChatNavigation = useCallback(() => {
    const targetAgentKey = agentUsername || agentId || lastAgent
    router.push(`/chat?agent=${targetAgentKey}`)
  }, [agentUsername, agentId, lastAgent, router])

  // Get permissions for settings sidebar
  const { isOriginalOwner, hasOwnerAccess, hasEditAccess } =
    useAgentPermissions(agent, user?._id)

  // State for memories modal
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = React.useState(false)

  // Get active tab from URL for settings mode
  const activeSettingsTab = searchParams?.get('tab') || 'profile'

  const handleSettingsTabChange = (tab: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', 'settings')
    url.searchParams.set('tab', tab)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const collapsedNavItems = React.useMemo(
    () => [
      {
        title: 'Agents',
        onClick: () => router.push('/agents'),
        isActive: pathname === '/agents' || pathname?.startsWith('/agents/'),
        icon: (
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        title: 'Tasks',
        onClick: () => router.push('/tasks'),
        isActive: pathname === '/tasks' || pathname?.startsWith('/tasks/'),
        icon: (
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        title: 'Explore',
        onClick: () => router.push('/explore?type=creations'),
        isActive: pathname?.startsWith('/explore'),
        icon: (
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
        ),
      },
      {
        title: 'Studio',
        onClick: () => router.push('/studio'),
        isActive: pathname?.startsWith('/studio'),
        isExternal: true,
        icon: (
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
        ),
      },
    ],
    [pathname, router],
  )

  // Show collapsed sidebar with icons only
  // Show skeleton loading state until mounted to avoid hydration mismatch
  // while still displaying visual feedback (auth state differs between server and client)
  // IMPORTANT: Always show the same skeleton structure regardless of isCollapsed to avoid
  // hydration mismatch (isCollapsed comes from localStorage which differs server/client)
  if (!hasMounted) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Skeleton header */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-between mb-4 mr-2 pt-3">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        {/* Skeleton navigation buttons */}
        <div className="mb-4 mr-2 flex-shrink-0 flex-col hidden md:flex gap-1">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
        {/* Skeleton session list */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex flex-col gap-1 pb-2 mr-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
        {/* Skeleton user profile */}
        <div className="border-t bg-background -ml-2 w-[calc(100%_+_0.5rem)] flex-shrink-0 p-3">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 h-full min-h-0 pt-2">
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

        {/* New Chat icon */}
        <button
          onClick={handleNewChatNavigation}
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
            'hover:bg-muted/20',
          )}
          title="New Chat"
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Navigation icons */}
        {collapsedNavItems.map(item => (
          <button
            key={item.title}
            onClick={item.onClick}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
              hasMounted && item.isActive
                ? 'bg-primary/20 text-primary-foreground'
                : 'hover:bg-muted/20',
            )}
            title={item.title}
          >
            {item.icon}
          </button>
        ))}

        {/* Spacer to push profile to bottom */}
        <div className="flex-1" />

        <div className="w-full px-1">
          <SidebarUserProfile variant="collapsed" />
        </div>
      </div>
    )
  }

  // Show settings sidebar when in settings mode
  if (viewMode === 'settings' && agent) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Desktop: Eden logo + close button at the top */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-between mb-4 mr-2 pt-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center pl-2"
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

        {/* Mobile sidebar header with navigation - only show in mobile sidebar when NOT in Sheet */}
        {!isMobileSidebar && (
          <div className="md:hidden flex-shrink-0">
            <MobileSidebarHeader onItemClick={onItemClick} />
          </div>
        )}

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
    <div className="flex flex-col h-full min-h-0">
      {/* Desktop: Eden logo + close button at the top */}
      <div className="hidden md:flex flex-shrink-0 items-center justify-between mb-4 mr-2 pt-3">
        <button
          onClick={() => router.push('/')}
          className="flex items-center pl-2"
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

      {/* Mobile sidebar header with navigation - only show in mobile sidebar when NOT in Sheet */}
      {!isMobileSidebar && (
        <div className="md:hidden">
          <MobileSidebarHeader onItemClick={onItemClick} />
        </div>
      )}

      {/* Mobile: Navigation Buttons - scrollable when in sheet, shown outside scroll container when NOT in sheet */}
      {!isMobileSidebar && (
        <div className="mb-4 mr-2 flex-col md:hidden flex">
          {/* New Chat button with selected agent avatar */}
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                onItemClick?.()
                handleNewChatNavigation()
              }}
              className={cn(
                'flex flex-1 justify-start items-center gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
                'bg-transparent hover:bg-muted/50 text-foreground',
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>New Chat</span>
            </Button>
            {agentId && agent && (
              <button
                onClick={() => {
                  onItemClick?.()
                  onAgentSelect?.()
                }}
                className="shrink-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getCloudfrontOriginalUrl(agent.userImage)}
                    alt={agent.name || agent.username}
                  />
                  <AvatarFallback>
                    {(agent.name || agent.username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>

          {/* Agents button */}
          <Button
            variant="ghost"
            onClick={() => {
              onItemClick?.()
              router.push('/agents')
            }}
            className={cn(
              'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
              pathname === '/agents' || pathname?.startsWith('/agents/')
                ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                : 'bg-transparent hover:bg-muted/50 text-foreground',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Agents</span>
          </Button>

          {/* Tasks button */}
          <Button
            variant="ghost"
            onClick={() => {
              onItemClick?.()
              router.push('/tasks')
            }}
            className={cn(
              'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
              pathname === '/tasks' || pathname?.startsWith('/tasks/')
                ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                : 'bg-transparent hover:bg-muted/50 text-foreground',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Tasks</span>
          </Button>

          {/* Explore button */}
          <Button
            variant="ghost"
            onClick={() => {
              onItemClick?.()
              router.push('/explore?type=creations')
            }}
            className={cn(
              'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
              pathname?.startsWith('/explore')
                ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                : 'bg-transparent hover:bg-muted/50 text-foreground',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Explore</span>
          </Button>

          {/* Studio button */}
          <Button
            variant="ghost"
            onClick={() => {
              onItemClick?.()
              router.push('/studio')
            }}
            className={cn(
              'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2 group',
              pathname?.startsWith('/studio')
                ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                : 'bg-transparent hover:bg-muted/50 text-foreground',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span className="flex-1 text-left">Studio</span>
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
              className="size-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </Button>
        </div>
      )}

      {/* Desktop: Navigation Buttons - don't close sidebar on desktop */}
      <div className="mb-4 mr-2 flex-shrink-0 flex-col hidden md:flex">
        {/* New Chat button with selected agent avatar */}
        <div className="flex w-full items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleNewChatNavigation}
            className={cn(
              'flex flex-1 justify-start items-center gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
              'bg-transparent hover:bg-muted/50 text-foreground',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>New Chat</span>
          </Button>
          {agentId && agent && (
            <button onClick={() => onAgentSelect?.()} className="shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={getCloudfrontOriginalUrl(agent.userImage)}
                  alt={agent.name || agent.username}
                />
                <AvatarFallback>
                  {(agent.name || agent.username)?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>

        {/* Agents button */}
        <Button
          variant="ghost"
          onClick={() => {
            router.push('/agents')
          }}
          className={cn(
            'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
            pathname === '/agents' || pathname?.startsWith('/agents/')
              ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
              : 'bg-transparent hover:bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Agents</span>
        </Button>

        {/* Tasks button */}
        <Button
          variant="ghost"
          onClick={() => {
            router.push('/tasks')
          }}
          className={cn(
            'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
            pathname === '/tasks' || pathname?.startsWith('/tasks/')
              ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
              : 'bg-transparent hover:bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Tasks</span>
        </Button>

        {/* Explore button */}
        <Button
          variant="ghost"
          onClick={() => {
            router.push('/explore?type=creations')
          }}
          className={cn(
            'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
            pathname?.startsWith('/explore')
              ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
              : 'bg-transparent hover:bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Explore</span>
        </Button>

        {/* Studio button */}
        <Button
          variant="ghost"
          onClick={() => {
            router.push('/studio')
          }}
          className={cn(
            'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2 group',
            pathname?.startsWith('/studio')
              ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
              : 'bg-transparent hover:bg-muted/50 text-foreground',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span className="flex-1 text-left">Studio</span>
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
            className="size-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </Button>
      </div>

      {/* Content area based on mode */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div
          id="sidebar-scroll-container"
          ref={sessionsScrollContainerRef}
          className="flex-1 min-h-0 flex flex-col overflow-y-auto"
        >
          {/* Mobile: Navigation Buttons - inside scroll container when in mobile sheet */}
          {isMobileSidebar && (
            <div className="mb-4 mr-2 flex-col flex pt-3">
              {/* New Chat button with selected agent avatar */}
              <div className="flex w-full items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onItemClick?.()
                    handleNewChatNavigation()
                  }}
                  className={cn(
                    'flex flex-1 justify-start items-center gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
                    'bg-transparent hover:bg-muted/50 text-foreground',
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>New Chat</span>
                </Button>
                {agentId && agent && (
                  <button
                    onClick={() => {
                      onItemClick?.()
                      onAgentSelect?.()
                    }}
                    className="shrink-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={getCloudfrontOriginalUrl(agent.userImage)}
                        alt={agent.name || agent.username}
                      />
                      <AvatarFallback>
                        {(agent.name || agent.username)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                )}
              </div>

              {/* Agents button */}
              <Button
                variant="ghost"
                onClick={() => {
                  onItemClick?.()
                  router.push('/agents')
                }}
                className={cn(
                  'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
                  pathname === '/agents' || pathname?.startsWith('/agents/')
                    ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                    : 'bg-transparent hover:bg-muted/50 text-foreground',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Agents</span>
              </Button>

              {/* Tasks button */}
              <Button
                variant="ghost"
                onClick={() => {
                  onItemClick?.()
                  router.push('/tasks')
                }}
                className={cn(
                  'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
                  pathname === '/tasks' || pathname?.startsWith('/tasks/')
                    ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                    : 'bg-transparent hover:bg-muted/50 text-foreground',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Tasks</span>
              </Button>

              {/* Explore button */}
              <Button
                variant="ghost"
                onClick={() => {
                  onItemClick?.()
                  router.push('/explore?type=creations')
                }}
                className={cn(
                  'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2',
                  pathname?.startsWith('/explore')
                    ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                    : 'bg-transparent hover:bg-muted/50 text-foreground',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>Explore</span>
              </Button>

              {/* Studio button */}
              <Button
                variant="ghost"
                onClick={() => {
                  onItemClick?.()
                  router.push('/studio')
                }}
                className={cn(
                  'flex w-full justify-start gap-3 rounded-md font-medium transition-colors h-11 text-[15px] px-2 py-2 group',
                  pathname?.startsWith('/studio')
                    ? 'bg-muted/40 hover:bg-muted/50 text-foreground'
                    : 'bg-transparent hover:bg-muted/50 text-foreground',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="flex-1 text-left">Studio</span>
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
                  className="size-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Button>
            </div>
          )}

          <RecentAgents onItemClick={onItemClick} />

          <MainLeft
            onItemClick={onItemClick}
            agentId={agentId}
            isChat={isChat}
            scrollContainerRef={sessionsScrollContainerRef}
          />
        </div>
      </div>

      {/* User Profile Section - Always outside scroll container to stay sticky at bottom */}
      <SidebarUserProfile />

      {/* Memories Modal for non-editor users */}
      {agent && (
        <Dialog
          open={isMemoriesModalOpen}
          onOpenChange={setIsMemoriesModalOpen}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Memories - {agent.name}</DialogTitle>
            </DialogHeader>
            <AgentMemoryView agent={agent} />
          </DialogContent>
        </Dialog>
      )}
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
          'hidden md:flex md:flex-col h-full min-h-0 bg-accent border-r pl-2 pr-0 py-3 transition-all duration-300 ease-in-out',
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
