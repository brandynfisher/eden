'use client'

import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useEffect, useState } from 'react'

const DEFAULT_AGENT = 'eve'

/**
 * Hook to get the last visited agent from user preferences
 * Returns the appropriate chat URL for navigation
 */
export const useLastAgent = () => {
  const { user } = useAuthState()
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!user })
  const [isHydrated, setIsHydrated] = useState(false)

  // Mark as hydrated on client side
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get the most recent agent (top of the stack)
  const lastAgent =
    lastAgents && lastAgents.length > 0
      ? lastAgents[0].username || lastAgents[0]._id
      : DEFAULT_AGENT

  // Return the chat URL for the last visited agent
  const getChatUrl = () => {
    return `/chat/${lastAgent}`
  }

  return {
    lastAgent,
    getChatUrl,
    isHydrated, // Useful for preventing hydration mismatches
  }
}
