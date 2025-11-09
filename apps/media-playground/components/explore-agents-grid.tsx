'use client'

import AgentCard from '@/components/card/agent-card'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

interface ExploreAgentsGridProps {
  query: FeedAgentCursorArguments
}

export function ExploreAgentsGrid({ query }: ExploreAgentsGridProps) {
  const { user } = useAuthState()
  const queryKey = useMemo(() => ['feed', 'agents', 'explore', query], [query])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const paginationRoute = createCursorPaginationRoute('/api/feed/agents', {
        ...query,
        cursor: '',
        ...(user?._id ? { excludeOwner: user._id } : {}),
      })
      const result = await fetcher<{ docs: Agent[]; nextCursor?: string }>(
        paginationRoute,
      )
      return result
    },
    staleTime: 30000,
  })

  const agents = useMemo(() => {
    if (!data?.docs) return []
    // Backend filtering handles exclusion, just limit to the query limit
    return data.docs.slice(0, query.limit || 15)
  }, [data, query.limit])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No agents found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent._id}
          agent={agent}
          queryKey={queryKey}
          hideContextMenu={true}
          improvedLayout={true}
        />
      ))}
    </div>
  )
}
