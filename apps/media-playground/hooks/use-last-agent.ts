'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LAST_AGENT_KEY = 'eden_last_visited_agent'
const DEFAULT_AGENT = 'eve'

/**
 * Hook to track and persist the last visited agent
 * Automatically updates when user navigates to /chat/{agent} routes
 * Returns the appropriate chat URL for navigation
 */
export const useLastAgent = () => {
  const pathname = usePathname()
  const [lastAgent, setLastAgent] = useState<string>(DEFAULT_AGENT)
  const [isHydrated, setIsHydrated] = useState(false)

  // Initialize from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAST_AGENT_KEY)
      if (stored) {
        setLastAgent(stored)
      }
      setIsHydrated(true)
    }
  }, [])

  // Update last agent when navigating to chat routes
  useEffect(() => {
    if (!pathname || !isHydrated) return

    // Extract agent from /chat/{agent} or /chat/{agent}/{sessionId} routes
    const chatMatch = pathname.match(/^\/chat\/([^/]+)/)
    if (chatMatch) {
      const agentName = chatMatch[1]

      // Only update if it's different and not 'new' (which is a special route)
      if (agentName !== 'new' && agentName !== lastAgent) {
        setLastAgent(agentName)
        if (typeof window !== 'undefined') {
          localStorage.setItem(LAST_AGENT_KEY, agentName)
        }
      }
    }
  }, [pathname, lastAgent, isHydrated])

  // Return the chat URL for the last visited agent
  const getChatUrl = () => {
    return `/chat/${lastAgent}`
  }

  // Force update the last agent (useful for programmatic updates)
  const updateLastAgent = (agentName: string) => {
    setLastAgent(agentName)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_AGENT_KEY, agentName)
    }
  }

  return {
    lastAgent,
    getChatUrl,
    updateLastAgent,
    isHydrated, // Useful for preventing hydration mismatches
  }
}
