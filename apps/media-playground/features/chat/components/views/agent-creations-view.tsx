'use client'

import CreationsFeed from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { FC, useMemo, useState } from 'react'
import * as React from 'react'

const AgentCreationsView: FC<{
  agent: Agent
  user: unknown
}> = ({ agent, user }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all')

  // Construct the query for RecentCreationsFeed based on filterMode
  const recentCreationsQuery = useMemo(() => {
    if (!agent) return {}
    const baseAgentQuery = { agent: agent._id }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseAgentQuery, user: user._id }
    }
    return baseAgentQuery
  }, [agent, filterMode, user?._id])

  const showFilterTabs = !!user

  return (
    <div className="flex-1 overflow-auto bg-accent">
      <div className="w-full px-2 py-6">
        <div className="flex text-lg items-center gap-2 justify-center mb-6 pt-4">
          {`Creations with ${agent.name}`}
        </div>

        {/* Filter Tabs */}
        {showFilterTabs && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
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
            </div>
          </div>
        )}

        {/* Use CreationsFeed directly with our custom breakpoints */}
        <div className="w-full">
          <CreationsFeed
            query={recentCreationsQuery}
            minCols={1}
            maxCols={8}
            breakpoints={[
              { minWidth: 1800, columns: 8 }, // Full desktop screens
              { minWidth: 1600, columns: 7 }, // Large desktop
              { minWidth: 1400, columns: 6 }, // Desktop
              { minWidth: 1200, columns: 5 }, // Large laptop
              { minWidth: 1000, columns: 4 }, // Laptop
              { minWidth: 768, columns: 3 }, // Tablet landscape
              { minWidth: 640, columns: 2 }, // Large tablet/small desktop only
              { minWidth: 0, columns: 1 }, // Mobile phones (iPhone, Android) - single column
            ]}
            showSkeleton
          />
        </div>
      </div>
    </div>
  )
}

export default AgentCreationsView
