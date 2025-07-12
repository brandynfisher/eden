'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewMode } from '@/features/chat/types'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { canEditAgent, isAgentOwner } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  ImageIcon,
  MoreHorizontal,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

interface SessionListItemProps {
  id: string
  title: string
  isActive: boolean
  onItemClick?: () => void
  isFromTrigger?: boolean
}

const SessionListItem: FC<SessionListItemProps> = ({
  id,
  title,
  isActive,
  onItemClick,
  isFromTrigger = false,
}) => {
  const {
    renameSession: renameSessionQuery,
    deleteSession: deleteSessionQuery,
  } = useSessionListQuery({
    enabled: false,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const isSubmittingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const deleteSession = async (sessionId: string) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`)

      await deleteSessionQuery(sessionId)

      toast.success('Session deleted', {
        description: 'Your session has been deleted.',
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete session', {
        description: 'Please try again later.',
        dismissible: true,
        richColors: true,
      })
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
        await axios.patch(`/api/sessions/${sessionId}`, {
          title,
        })

        await renameSessionQuery(sessionId, title)

        toast.success('Session renamed', {
          description: 'Your session has been renamed.',
          dismissible: true,
          richColors: true,
        })
      } catch (error) {
        console.error(error)
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
    [],
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
        'group flex justify-between font-normal items-center gap-1 rounded-md transition-all mr-1 text-sm relative p-0.5',
        isActive
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground font-medium'
          : 'hover:text-white hover:bg-muted/50',
      )}
    >
      <div className="flex-grow min-w-0 pl-1.5 pr-1 py-1.5 flex items-stretch">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow min-w-0 text-white">
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
              className="h-7 w-7 shrink-0 text-white hover:text-white"
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
              'flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center',
              isActive ? 'text-primary-foreground' : 'text-white',
            )}
            onClick={onItemClick}
            disabled={isEditing}
          >
            {isFromTrigger && (
              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
            )}
            <div className="overflow-hidden whitespace-nowrap text-ellipsis">
              {title || 'Untitled'}
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
              <span className="sr-only">Session Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => {
                setIsEditing(true)
                setNewTitle(title || '')
              }}
            >
              <PencilIcon className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10"
              onSelect={e => {
                e.preventDefault()
                deleteSession(id)
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

function isNewSessionRoute(
  params: Record<string, string | string[]>,
  isChat?: boolean,
): boolean {
  // For chat2: /chat2/[agentId] (no sessionId)
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
}> = ({ onItemClick, isChat, onViewModeChange }) => {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.agentId as string
  const isNewSession = isNewSessionRoute(params || {}, isChat)

  const handleClick = () => {
    onItemClick?.()
    if (isChat && agentId) {
      // Switch to chat mode first, then navigate
      onViewModeChange?.('chat')
      router.push(`/chat2/${agentId}`, { scroll: false })
    } else {
      router.push('/sessions/new', { scroll: false })
    }
  }

  return (
    <Button
      variant={isNewSession ? 'outline' : 'default'}
      onClick={handleClick}
      className={cn(
        'flex w-full justify-start gap-2 py-3 mb-2 rounded-md font-medium transition-colors',
        isNewSession
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground'
          : 'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
      )}
    >
      <EditIcon className="size-4" />
      <span>{isChat ? 'New Chat' : 'New Session'}</span>
    </Button>
  )
}

// Navigation buttons component for Creations, Tasks, and Settings
const NavigationButtons: FC<{
  onItemClick?: () => void
  agent: Agent | null | undefined
  userId?: string | null
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}> = ({ onItemClick, agent, userId, viewMode, onViewModeChange }) => {
  const { user } = useAuthState()
  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const handleNavClick = (mode: ViewMode) => {
    onViewModeChange(mode)
    onItemClick?.()
  }

  return (
    <div className="flex flex-col gap-1 mb-2 mr-2">
      <Button
        variant={viewMode === 'creations' ? 'outline' : 'default'}
        onClick={() => handleNavClick('creations')}
        className={cn(
          'flex w-full justify-start gap-2 py-2 rounded-md font-medium transition-colors',
          viewMode === 'creations'
            ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground'
            : 'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
        )}
      >
        <ImageIcon className="size-4" />
        <span>Creations</span>
      </Button>

      {isAgentOwner(agent, userId) && isPreviewUser && (
        <Button
          variant={viewMode === 'tasks' ? 'outline' : 'default'}
          onClick={() => handleNavClick('tasks')}
          className={cn(
            'flex w-full justify-start gap-2 py-2 rounded-md font-medium transition-colors',
            viewMode === 'tasks'
              ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground'
              : 'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
          )}
        >
          <ClockIcon className="size-4" />
          <span>Tasks</span>
        </Button>
      )}

      {canEditAgent(agent, userId) && (
        <Button
          variant={viewMode === 'settings' ? 'outline' : 'default'}
          onClick={() => handleNavClick('settings')}
          className={cn(
            'flex w-full justify-start gap-2 py-2 rounded-md font-medium transition-colors',
            viewMode === 'settings'
              ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground'
              : 'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
          )}
        >
          <SettingsIcon className="size-4" />
          <span>Settings</span>
        </Button>
      )}
    </div>
  )
}

// Explore and Tools section component
const ExploreToolsSection: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const router = useRouter()

  const handleExploreClick = () => {
    onItemClick?.()
    router.push('/explore?type=agents')
  }

  const handleToolsClick = () => {
    onItemClick?.()
    router.push('/explore?type=tools')
  }

  return (
    <div className="flex flex-col gap-1 mb-2 mr-2">
      <Button
        variant="default"
        onClick={handleExploreClick}
        className={cn(
          'flex w-full justify-start gap-2 py-2 rounded-md font-medium transition-colors',
          'bg-blue-900/60 hover:bg-blue-800/60 border-blue-700/60 hover:border-blue-600',
        )}
      >
        <span>🔍</span>
        <span>Explore</span>
      </Button>

      <Button
        variant="default"
        onClick={handleToolsClick}
        className={cn(
          'flex w-full justify-start gap-2 py-2 rounded-md font-medium transition-colors',
          'bg-blue-900/60 hover:bg-blue-800/60 border-blue-700/60 hover:border-blue-600',
        )}
      >
        <span>🛠️</span>
        <span>Use Tools</span>
      </Button>
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
  const { isSignedIn, verifyAuth } = useAuthState()
  const router = useRouter()
  const params = useParams()
  const currentSessionId =
    (params?.id as string) || (params?.sessionId as string)
  const { isLoading, hasMore, isFetchingNextPage, fetchNextPage, sessions } =
    useSessionListQuery({
      enabled: !!isSignedIn,
      agent_id: agentId,
    })

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
        threshold: 1.0,
        rootMargin: '10px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex flex-col text-sm font-medium flex-1 min-h-0 mr-1">
      {/* Sticky Recent header */}
      <div className="sticky top-0 bg-accent z-10 pb-1 mb-1">
        <div className="text-muted-foreground">Recent</div>
      </div>

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
                {sessions
                  .filter(
                    (session): session is NonNullable<typeof session> =>
                      session != null &&
                      // Include sessions with valid titles
                      ((session.title != null &&
                        session.title !== '' &&
                        session.title !== 'Untitled') ||
                        // Include trigger sessions even without titles
                        !!session.trigger),
                  )
                  .map(session => (
                    <SessionListItem
                      key={session._id}
                      id={session._id}
                      title={
                        session.title ||
                        (session.trigger ? 'Task Session' : 'Untitled')
                      }
                      isActive={session._id === currentSessionId}
                      isFromTrigger={!!session.trigger}
                      onItemClick={() => {
                        onItemClick?.()
                        if (isChat && agentId) {
                          // Switch to chat mode first, then navigate to session
                          onViewModeChange?.('chat')
                          router.push(`/chat2/${agentId}/${session._id}`, {
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
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
  agent?: Agent | null | undefined
  userId?: string | null
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}) => {
  return (
    <>
      <div className="mb-2 mr-2">
        <TopLeft
          onItemClick={onItemClick}
          isChat={isChat}
          onViewModeChange={onViewModeChange}
        />
      </div>

      {/* Navigation buttons for Creations, Tasks, Settings */}
      {agent && viewMode && onViewModeChange && (
        <NavigationButtons
          onItemClick={onItemClick}
          agent={agent}
          userId={userId}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}

      {/* Explore and Tools section */}
      <ExploreToolsSection onItemClick={onItemClick} />

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
