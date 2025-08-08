import { fetcher } from '@/lib/fetcher'
import {
  Agent,
  AgentPermission,
  AgentsGetPermissionsResponse,
  PermissionLevel,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export interface UseAgentPermissionsResult {
  isOriginalOwner: boolean
  hasOwnerAccess: boolean
  hasEditAccess: boolean
  permissionLevel: PermissionLevel | null
  isLoading: boolean
}

export const useAgentPermissions = (
  agent: Agent | null | undefined,
  userId: string | undefined,
): UseAgentPermissionsResult => {
  // Check if user is the original owner
  const isOriginalOwner = useMemo(() => {
    return !!(
      agent &&
      userId &&
      (agent.owner._id === userId || agent.owner.userId === userId)
    )
  }, [agent, userId])

  // Use react-query to fetch permissions with proper caching and invalidation
  const { data: permissionsData, isLoading: isPermissionsLoading } =
    useQuery<AgentsGetPermissionsResponse>({
      queryKey: ['agents', agent?._id, 'permissions'],
      queryFn: () => fetcher(`/api/agents/${agent!._id}/permissions`),
      enabled: !!(agent && userId && !isOriginalOwner), // Only fetch if not original owner
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

  const permissionLevel = useMemo(() => {
    if (isOriginalOwner) {
      return PermissionLevel.Owner
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
    isOriginalOwner || permissionLevel === PermissionLevel.Owner
  const hasEditAccess =
    hasOwnerAccess || permissionLevel === PermissionLevel.Editor

  return {
    isOriginalOwner,
    hasOwnerAccess,
    hasEditAccess,
    permissionLevel,
    isLoading,
  }
}
