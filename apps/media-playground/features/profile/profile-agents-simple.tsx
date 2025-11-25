'use client'

import AgentCard from '@/components/card/agent-card'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import {
  Agent,
  AgentPermissionLevel,
  FeedAgentCursorArguments,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

type Props = {
  userId: string
  query?: FeedAgentCursorArguments
}

const ProfileAgentsSimple = ({ userId, query: queryProp }: Props) => {
  const { user } = useAuthState()

  const { sharedAgents } = useSharedAgentsQuery({
    enabled: !!user?._id,
  })

  const agentsQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      owner: userId,
      sort: ['stats.messageCount;-1'],
      ...queryProp,
    }),
    [userId, queryProp],
  )

  const queryKey = useMemo(
    () => ['feed', 'agents', 'profile', agentsQuery],
    [agentsQuery],
  )

  const { data: agentsData, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetcher<{ docs: Agent[]; nextCursor?: string }>(
        createCursorPaginationRoute('/api/feed/agents', {
          ...agentsQuery,
          cursor: '',
          limit: agentsQuery.limit || 40,
        }),
      ),
    staleTime: 30_000,
  })

  const agents = useMemo(() => agentsData?.docs || [], [agentsData])

  // Helper to check if the user has edit access to an agent
  const hasAgentEditAccess = useCallback(
    (agent: Agent): boolean => {
      if (!user?._id) return false

      // Check if user is the original owner
      if (agent?.owner) {
        const ownerId =
          typeof agent.owner === 'string' ? agent.owner : agent.owner._id
        if (ownerId === user._id) return true
      }

      // Check if user has edit access via sharing (co-owner or co-editor)
      const sharedAgent = sharedAgents.find(sa => sa.agent._id === agent._id)
      if (sharedAgent) {
        return (
          sharedAgent.permissionLevel === AgentPermissionLevel.Owner ||
          sharedAgent.permissionLevel === AgentPermissionLevel.Editor
        )
      }

      return false
    },
    [user?._id, sharedAgents],
  )

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

  if (!agents.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        {queryProp?.search
          ? 'No agents match your search.'
          : 'No agents found.'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent._id}
          agent={agent}
          improvedLayout
          hideContextMenu
          showSettings={hasAgentEditAccess(agent)}
        />
      ))}
    </div>
  )
}

export default ProfileAgentsSimple
