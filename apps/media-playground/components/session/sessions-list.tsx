'use client'

import LoadingIndicator from '@/components/loading-indicator'
import SessionCard from '@/components/session/session-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { FolderIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type SessionsListProps = {
  agentId?: string
  agentName?: string
  agentUsername?: string
  showHeader?: boolean
  className?: string
}

export default function SessionsList({
  agentId,
  agentName,
  agentUsername,
  showHeader = true,
  className,
}: SessionsListProps) {
  const { isSignedIn, verifyAuth } = useAuthState()
  const { isLoading, sessions, hasMore, fetchNextPage, isFetchingNextPage } =
    useSessionListQuery({
      enabled: !!isSignedIn,
      agent_id: agentId,
    })

  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null)
  const isFetchingRef = useRef(isFetchingNextPage)
  const hasMoreRef = useRef(hasMore)

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage
    hasMoreRef.current = hasMore
  }, [isFetchingNextPage, hasMore])

  useEffect(() => {
    const sentinel = loadMoreNode
    if (!sentinel) return

    const observer = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (!entry?.isIntersecting) return
      if (hasMoreRef.current && !isFetchingRef.current) {
        fetchNextPage()
      }
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, loadMoreNode])

  const copy = agentName
    ? {
        title: `Chats with ${agentName}`,
        signInTitle: `Sign in to view your chats with ${agentName}`,
        signInDescription: `Create and manage conversations with ${agentName}`,
        emptyTitle: `No chats with ${agentName} yet`,
        emptyDescription: `Start your first conversation with ${agentName}`,
        newSessionLabel: `Chat with ${agentName}`,
        newSessionHref: agentUsername
          ? `/chat?agent=${agentUsername}`
          : '/chat',
      }
    : {
        title: 'My Sessions',
        description: 'Manage your conversations and collaborative sessions',
        signInTitle: 'Sign in to view your sessions',
        signInDescription: 'Create and manage conversations with AI agents',
        emptyTitle: 'No sessions yet',
        emptyDescription:
          'Start your first conversation or collaborative session',
        newSessionLabel: 'New Session',
        newSessionHref: '/chat',
      }

  // Filter and sort sessions for display
  const displaySessions = useMemo(() => {
    const filtered = sessions.filter(
      (session): session is NonNullable<typeof session> => {
        if (!session) return false
        if (session.visible === false) return false
        if (session.visible === true) return true
        if (session.parent_session) return false
        return true
      },
    )

    return filtered.sort((a, b) => {
      // Sort by updatedAt/createdAt in descending order (most recent first)
      const aDate = new Date(a.updatedAt || a.createdAt)
      const bDate = new Date(b.updatedAt || b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })
  }, [sessions])

  if (!isSignedIn) {
    return (
      <div
        className={`container mx-auto px-4 py-8 max-w-6xl ${className || ''}`}
      >
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{copy.signInTitle}</h2>
          <p className="text-muted-foreground mb-6">{copy.signInDescription}</p>
          <Button onClick={verifyAuth}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`container mx-auto px-4 py-8 max-w-6xl ${className || ''}`}>
      {showHeader && (
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{copy.title}</h1>
            <p className="text-muted-foreground mt-1">{copy.description}</p>
          </div>
          <Link href={copy.newSessionHref}>
            <Button className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              {copy.newSessionLabel}
            </Button>
          </Link>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : displaySessions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displaySessions.map(session => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
          <div ref={setLoadMoreNode} className="h-10" />
          {isFetchingNextPage && (
            <div className="mt-6 flex justify-center">
              <LoadingIndicator className="h-5 w-5 text-primary" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{copy.emptyTitle}</h2>
          <p className="text-muted-foreground mb-6">{copy.emptyDescription}</p>
          <Link href={copy.newSessionHref}>
            <Button className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              {copy.newSessionLabel}
            </Button>
          </Link>
        </div>
      )}

      {displaySessions.length > 0 && hasMore === false && (
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Showing all {displaySessions.length} session
          {displaySessions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
