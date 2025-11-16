'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { Button } from '@/components/ui/button'
import CreationsFeed from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import { Agent, Creator } from '@edenlabs/eden-sdk'
import { EditIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useMemo, useRef, useState } from 'react'
import * as React from 'react'

const AgentCreationsView: FC<{
  agent: Agent
  user?: Creator
}> = ({ agent, user }) => {
  const [filterMode, setFilterMode] = useState<'mine' | 'all'>('mine')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Construct the query for RecentCreationsFeed based on filterMode
  const recentCreationsQuery = useMemo(() => {
    if (!agent) return {}
    const baseAgentQuery = { agent: agent._id, search }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseAgentQuery, user: user._id }
    }
    return baseAgentQuery
  }, [agent, filterMode, user?._id, search])

  const showFilterTabs = !!user

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-auto bg-background"
    >
      <div className="w-full px-2 py-6">
        {/* Desktop header with New Chat button */}
        <div className="hidden md:flex text-lg items-center gap-2 justify-between mb-6 pt-4 px-4">
          <div className="flex-1" />
          <div className="flex-1 text-center">
            {`Creations with ${agent.name}`}
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              onClick={() => router.push(`/chat/${agent.username}`)}
              variant="default"
              className="flex items-center gap-2"
            >
              <EditIcon className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Mobile header - just title, button is in mobile nav header */}
        <div className="md:hidden text-lg text-center mb-6 pt-4 px-4">
          {`Creations with ${agent.name}`}
        </div>

        {/* Filter Tabs and Search - Desktop: side by side, Mobile: stacked */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
          {showFilterTabs && (
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
          )}
          <FeedSearchForm
            handleSearch={setSearch}
            className="max-w-md w-full md:w-auto"
          />
        </div>

        {/* Use CreationsFeed directly with our custom breakpoints */}
        <div className="w-full">
          <CreationsFeed
            query={recentCreationsQuery}
            minCols={1}
            maxCols={8}
            scrollRef={scrollContainerRef}
            showSkeleton
          />
        </div>
      </div>
    </div>
  )
}

export default AgentCreationsView
