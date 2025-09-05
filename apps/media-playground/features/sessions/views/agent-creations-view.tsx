'use client'

import CreationsFeed, {
  CreationsFeedHandle,
} from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import { Agent, Creator } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'

const AgentCreationsView: FC<{
  agent: Agent
  user?: Creator
}> = ({ agent, user }) => {
  const [filterMode, setFilterMode] = useState<'mine' | 'all'>('mine')
  const router = useRouter()
  const pathname = usePathname()
  const creationsFeedRef = useRef<CreationsFeedHandle>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Construct the query for RecentCreationsFeed based on filterMode
  const recentCreationsQuery = useMemo(() => {
    if (!agent) return {}
    const baseAgentQuery = { agent: agent._id }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseAgentQuery, user: user._id }
    }
    return baseAgentQuery
  }, [agent, filterMode, user?._id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if we're viewing a creation modal
      if (!pathname?.startsWith('/creations/')) return

      const creationId = pathname.split('/creations/')[1]
      if (!creationId || !creationsFeedRef.current) return

      let targetId: string | null = null

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'prev',
        )
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'next',
        )
      }

      if (targetId) {
        router.push(`/creations/${targetId}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pathname, router])
  const handleCreationNavigation = useCallback(
    (creationId: string) => {
      // This could be used for programmatic navigation if needed
      router.push(`/creations/${creationId}`)
    },
    [router],
  )

  const showFilterTabs = !!user

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-accent">
      <div className="w-full px-2 py-6">
        <div className="flex text-lg items-center gap-2 justify-center mb-6 pt-4">
          {`Creations with ${agent.name}`}
        </div>

        {/* Filter Tabs */}
        {showFilterTabs && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setFilterMode('mine')}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
                  filterMode === 'mine' &&
                    'bg-background text-foreground shadow-sm',
                )}
              >
                My Creations
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
                  filterMode === 'all' &&
                    'bg-background text-foreground shadow-sm',
                )}
              >
                All Creations
              </button>
            </div>
          </div>
        )}

        {/* Use CreationsFeed directly with our custom breakpoints */}
        <div className="w-full">
          <CreationsFeed
            ref={creationsFeedRef}
            query={recentCreationsQuery}
            minCols={1}
            maxCols={8}
            scrollRef={scrollContainerRef}
            showSkeleton
            onNavigate={handleCreationNavigation}
          />
        </div>
      </div>
    </div>
  )
}

export default AgentCreationsView
