'use client'

import MyAgentCard from '@/components/card/my-agent-card'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

const HomePage = () => {
  const { user, verifyAuth } = useAuthState()
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)

  // Query for user's agents - filter by owner, sort by message count
  const query: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 3,
      ...(user?._id ? { owner: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: ['stats.userMessageCount;-1'],
    }),
    [user?._id, searchQuery],
  )

  interface AgentPage {
    docs: Agent[]
    nextCursor?: string
  }

  const { data, isLoading } = useInfiniteQuery<AgentPage>({
    queryKey: ['feed', 'agents', 'my-agents', query],
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
  const myAgents = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.docs || []).slice(0, 3) as Agent[]
  }, [data])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">
          Please sign in to view your agents
        </p>
        <button
          onClick={verifyAuth}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Agents</h1>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <FeedSearchForm handleSearch={setSearchQuery} className="max-w-md" />
      </div>

      {/* Agents grid - single row, 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </>
        ) : myAgents.length > 0 ? (
          myAgents.map(agent => (
            <MyAgentCard
              key={agent._id}
              agent={agent}
              userId={user._id}
              onSettingsClick={() => setSettingsAgentId(agent.username)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No agents found matching your search'
                : 'You have no agents yet'}
            </p>
          </div>
        )}
      </div>

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

export default HomePage
