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
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import axios from 'axios'
import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  ImageIcon,
  MoreHorizontal,
  PencilIcon,
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
        'group flex justify-between hover:text-white font-normal hover:bg-muted/50 items-center gap-1 rounded-md transition-all mr-1 text-sm relative p-0.5',
        isActive && 'bg-primary/30 text-white font-medium',
      )}
    >
      <div className="flex-grow min-w-0 pl-1.5 pr-1 py-1.5 flex items-stretch">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow min-w-0">
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
              className="h-8 flex-grow px-1 py-0 text-sm min-w-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 border-border"
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
            className="flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center gap-2"
            onClick={onItemClick}
            disabled={isEditing}
          >
            {isFromTrigger && (
              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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

const TopLeft: FC<{ onItemClick?: () => void; isChat?: boolean }> = ({
  onItemClick,
  isChat,
}) => {
  const router = useRouter()
  const params = useParams()
  const isNewSession =
    params.id === 'new' || (!params.sessionId && params.agentId)
  const agentId = params.agentId as string

  const handleClick = () => {
    onItemClick?.()
    if (isChat && agentId) {
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
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
          : 'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
      )}
    >
      <EditIcon className="size-4" />
      <span>{isChat ? 'New Chat' : 'New Session'}</span>
    </Button>
  )
}

const CreationsButton: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const router = useRouter()

  const handleClick = () => {
    onItemClick?.()
    router.push('/creations', { scroll: false })
  }

  return (
    <Button
      variant="default"
      onClick={handleClick}
      className={cn(
        'flex w-full justify-start gap-2 py-3 mb-2 rounded-md font-medium transition-colors',
        'border-gray-800 bg-gray-800 hover:bg-primary/20 border-primary/60 hover:border-primary',
      )}
    >
      <ImageIcon className="size-4" />
      <span>Creations</span>
    </Button>
  )
}

const MainLeft = ({
  onItemClick,
  agentId,
  isChat,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
}) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const router = useRouter()
  const params = useParams()
  const currentSessionId = (params.id as string) || (params.sessionId as string)
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
    <nav className="flex flex-col items-stretch gap-1 text-sm font-medium overflow-y-auto mr-2">
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
              {sessions.map(
                session =>
                  session && (
                    <SessionListItem
                      key={session._id}
                      id={session._id}
                      title={session.title || 'Untitled'}
                      isActive={session._id === currentSessionId}
                      isFromTrigger={!!session.trigger}
                      onItemClick={() => {
                        onItemClick?.()
                        if (isChat && agentId) {
                          // For chat2 routes, go to /chat2/[agentId]/[sessionId]
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
                  ),
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

export const SessionsSidebarContent = ({
  onItemClick,
  agentId,
  isChat,
}: {
  onItemClick?: () => void
  agentId?: string
  isChat?: boolean
}) => {
  return (
    <>
      <div className="mb-2 mr-2">
        <TopLeft onItemClick={onItemClick} isChat={isChat} />
        <CreationsButton onItemClick={onItemClick} />
      </div>
      <MainLeft onItemClick={onItemClick} agentId={agentId} isChat={isChat} />
    </>
  )
}

export const SessionsSidebar = React.memo(
  ({
    onItemClick,
    agentId,
  }: {
    onItemClick?: () => void
    agentId?: string
  }) => {
    return (
      <div className="flex flex-col w-full">
        <SessionsSidebarContent onItemClick={onItemClick} agentId={agentId} />
      </div>
    )
  },
)
SessionsSidebar.displayName = 'SessionsSidebar'
