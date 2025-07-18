'use client'

import SessionCard from '@/components/session/session-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { FolderIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

export default function SessionsPage() {
  const { isSignedIn, verifyAuth } = useAuthState()
  const { isLoading, sessions } = useSessionListQuery({
    enabled: !!isSignedIn,
  })

  // Filter and sort sessions for display
  const displaySessions = useMemo(() => {
    return sessions
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
      .sort((a, b) => {
        // Sort by updatedAt/createdAt in descending order (most recent first)
        const aDate = new Date(a.updatedAt || a.createdAt)
        const bDate = new Date(b.updatedAt || b.createdAt)
        return bDate.getTime() - aDate.getTime()
      })
  }, [sessions])

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Sign in to view your sessions
          </h2>
          <p className="text-muted-foreground mb-6">
            Create and manage conversations with AI agents
          </p>
          <Button onClick={verifyAuth}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your conversations and collaborative sessions
          </p>
        </div>
        <Link href="/sessions/new">
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : displaySessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displaySessions.map(session => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
          <p className="text-muted-foreground mb-6">
            Start your first conversation or collaborative session
          </p>
          <Link href="/sessions/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Create New Session
            </Button>
          </Link>
        </div>
      )}

      {/* Show total count if we have sessions */}
      {displaySessions.length > 0 && (
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Showing {displaySessions.length} session
          {displaySessions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
