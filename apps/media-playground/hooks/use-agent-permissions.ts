import { Agent, PermissionLevel } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { useEffect, useState } from 'react'

export interface UseAgentPermissionsResult {
  isOriginalOwner: boolean
  hasOwnerAccess: boolean
  hasEditAccess: boolean
  permissionLevel: PermissionLevel | null
  isLoading: boolean
}

export const useAgentPermissions = (
  agent: Agent | null,
  userId: string | undefined,
): UseAgentPermissionsResult => {
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPermissions = async () => {
      if (!agent || !userId) {
        setPermissionLevel(null)
        setIsLoading(false)
        return
      }

      // Check if user is the original owner
      if (agent.owner._id === userId || agent.owner.userId === userId) {
        setPermissionLevel(PermissionLevel.Owner)
        setIsLoading(false)
        return
      }

      // Check permissions from the API
      try {
        const response = await axios.get(`/api/agents/${agent._id}/permissions`)
        const permissions = response.data.permissions || []
        
        const userPermission = permissions.find(
          (p: any) => p.user._id === userId || p.user.userId === userId
        )
        
        if (userPermission) {
          setPermissionLevel(userPermission.level)
        } else {
          setPermissionLevel(null)
        }
      } catch (error) {
        console.error('Failed to check permissions:', error)
        setPermissionLevel(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [agent, userId])

  const isOriginalOwner = !!(
    agent &&
    userId &&
    (agent.owner._id === userId || agent.owner.userId === userId)
  )

  const hasOwnerAccess = isOriginalOwner || permissionLevel === PermissionLevel.Owner
  const hasEditAccess = hasOwnerAccess || permissionLevel === PermissionLevel.Editor

  return {
    isOriginalOwner,
    hasOwnerAccess,
    hasEditAccess,
    permissionLevel,
    isLoading,
  }
}