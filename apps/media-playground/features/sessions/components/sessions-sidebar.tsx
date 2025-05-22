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
  EditIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

interface SessionListItemProps {
  id: string
  title: string
  isActive: boolean
  onItemClick?: () => void
}

const SessionListItem: FC<SessionListItemProps> = ({
  id,
  title,
  isActive,
  onItemClick,
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
        'group flex justify-between hover:text-primary font-normal hover:bg-muted/50 items-center gap-1 rounded-lg transition-all mr-1 text-sm relative',
        isActive && 'bg-muted text-primary font-medium',
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
              <span className="sr-only">Save</span>
            </Button>
          </div>
        ) : (
          <button
            className="flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center"
            onClick={onItemClick}
            disabled={isEditing}
          >
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

const TopLeft: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  return (
    <Button
      variant="ghost"
      onClick={onItemClick}
      className={cn('flex w-full justify-between px-3 mb-1 bg-aui-muted')}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>New Session</span>
      </div>
      <EditIcon className="size-4" />
    </Button>
  )
}

const MainLeft = ({ onItemClick }: { onItemClick?: () => void }) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSessionId = searchParams.get('id')
  const { isLoading, hasMore, isFetchingNextPage, fetchNextPage, sessions } =
    useSessionListQuery({
      enabled: !!isSignedIn,
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
              {sessions.map(
                session =>
                  session && (
                    <SessionListItem
                      key={session._id}
                      id={session._id}
                      title={session.title || 'Untitled'}
                      isActive={session._id === currentSessionId}
                      onItemClick={() => {
                        onItemClick?.()
                        const url = new URL(window.location.href)
                        url.searchParams.set('id', session._id)
                        router.push(url.toString(), { scroll: false })
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
}: {
  onItemClick?: () => void
}) => {
  return (
    <>
      <div className="border-b mb-2">
        <TopLeft onItemClick={onItemClick} />
      </div>
      <MainLeft onItemClick={onItemClick} />
    </>
  )
}

export const SessionsSidebar = React.memo(
  ({ onItemClick }: { onItemClick?: () => void }) => {
    return (
      <div className="flex flex-col bg-[#0e1421] p-3 transition-all duration-300 ease-in-out w-full md:max-w-[320px]">
        <SessionsSidebarContent onItemClick={onItemClick} />
      </div>
    )
  },
)
SessionsSidebar.displayName = 'SessionsSidebar'
