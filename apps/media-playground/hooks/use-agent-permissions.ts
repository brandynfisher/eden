import { fetcher } from '@/lib/fetcher'
import {
  Agent,
  AgentPermission,
  AgentPermissionLevel,
  AgentsGetPermissionsResponse,
  MinimalAgent,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export interface UseAgentPermissionsResult {
  isOriginalOwner: boolean
  hasOwnerAccess: boolean
  hasEditAccess: boolean
  permissionLevel: AgentPermissionLevel | null
  isLoading: boolean
}

export const useAgentPermissions = (
  agent: (Pick<Agent, '_id' | 'owner'> | MinimalAgent) | null | undefined,
  userId: string | undefined,
): UseAgentPermissionsResult => {
  const agentId = agent?._id

  const ownerId = useMemo(() => {
    if (!agent) return null
    if (!agent.owner) return null
    return typeof agent.owner === 'string'
      ? agent.owner
      : agent.owner._id || agent.owner.userId || null
  }, [agent])

  // Check if user is the original owner
  const isOriginalOwner = useMemo(() => {
    return !!(ownerId && userId && ownerId === userId)
  }, [ownerId, userId])

  // Use react-query to fetch permissions with proper caching and invalidation
  const { data: permissionsData, isLoading: isPermissionsLoading } =
    useQuery<AgentsGetPermissionsResponse>({
      queryKey: ['agents', agentId, 'permissions'],
      queryFn: () => fetcher(`/api/agents/${agentId!}/permissions`),
      enabled: !!(agentId && userId && !isOriginalOwner), // Only fetch if not original owner
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

  const permissionLevel = useMemo(() => {
    if (isOriginalOwner) {
      return AgentPermissionLevel.Owner
    }

    if (!permissionsData?.permissions || !userId) {
      return null
    }

    const userPermission = permissionsData.permissions.find(
      (p: AgentPermission) => p.user._id === userId || p.user.userId === userId,
    )

    return userPermission?.level || null
  }, [isOriginalOwner, permissionsData, userId])

  const isLoading = !isOriginalOwner && isPermissionsLoading

  const hasOwnerAccess =
    isOriginalOwner || permissionLevel === AgentPermissionLevel.Owner
  const hasEditAccess =
    hasOwnerAccess || permissionLevel === AgentPermissionLevel.Editor

  return {
    isOriginalOwner,
    hasOwnerAccess,
    hasEditAccess,
    permissionLevel,
    isLoading,
  }
}
