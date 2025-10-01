import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import {
  AgentsListArguments,
  FeedAgentCursorArguments,
} from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

interface UseAgentsFeedDataProps {
  query: FeedAgentCursorArguments
  enabled?: boolean
}

export const useAgentsFeedData = ({
  query,
  enabled = true,
}: UseAgentsFeedDataProps) => {
  // Check if we're filtering for shared agents
  const isSharedFilter = useMemo(() => {
    const filter = query.filter as AgentsListArguments
    return filter?.ownership === 'shared'
  }, [query.filter])

  // Use shared agents query when filtering for shared agents
  const {
    sharedAgents,
    isLoading: isSharedLoading,
    error: sharedError,
  } = useSharedAgentsQuery({
    enabled: enabled && isSharedFilter,
  })

  // Transform shared agents to match the expected format
  const transformedSharedAgents = useMemo(() => {
    if (!isSharedFilter || !sharedAgents?.length) return []

    return sharedAgents.map(({ agent, permissionLevel }) => ({
      ...agent,
      // Add permission level as metadata if needed
      _sharedPermissionLevel: permissionLevel,
    }))
  }, [sharedAgents, isSharedFilter])

  return {
    isSharedFilter,
    sharedAgents: transformedSharedAgents,
    isLoading: isSharedFilter ? isSharedLoading : false,
    error: isSharedFilter ? sharedError : null,
  }
}
