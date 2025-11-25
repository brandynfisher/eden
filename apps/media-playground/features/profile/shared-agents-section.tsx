'use client'

import AgentCard from '@/components/card/agent-card'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import {
  AgentPermissionLevel,
  FeedAgentCursorArguments,
} from '@edenlabs/eden-sdk'
import { FC, useMemo } from 'react'

type Props = {
  query?: FeedAgentCursorArguments
}

export const SharedAgentsSection: FC<Props> = ({ query: queryProp }) => {
  const { sharedAgents, isLoading } = useSharedAgentsQuery({})

  // Filter and sort shared agents
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...sharedAgents]

    // Apply search filter if present
    if (queryProp?.search) {
      const searchLower = queryProp.search.toLowerCase()
      result = result.filter(
        ({ agent }) =>
          agent.name?.toLowerCase().includes(searchLower) ||
          agent.description?.toLowerCase().includes(searchLower) ||
          agent.username?.toLowerCase().includes(searchLower),
      )
    }

    // Sort by message count (default) or by specified sort
    result.sort((a, b) => {
      const aCount = a.agent?.stats?.messageCount || 0
      const bCount = b.agent?.stats?.messageCount || 0
      return bCount - aCount
    })

    return result
  }, [sharedAgents, queryProp?.search])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[200px] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (filteredAndSortedAgents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        {queryProp?.search
          ? 'No agents match your search.'
          : 'No one has shared agents with you yet.'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredAndSortedAgents.map(({ agent, permissionLevel }) => {
        // Show settings for shared agents if user has owner or editor access
        const hasEditAccess =
          permissionLevel === AgentPermissionLevel.Owner ||
          permissionLevel === AgentPermissionLevel.Editor

        return (
          <AgentCard
            key={agent._id}
            agent={agent}
            queryKey={['agents', agent._id]}
            improvedLayout={true}
            hideContextMenu={true}
            showSettings={hasEditAccess}
          />
        )
      })}
    </div>
  )
}
