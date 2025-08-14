'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useRef } from 'react'

type AuthMessage = {
  event: 'auth'
  data: {
    userId: string
    token: string
  }
}

// Decode JWT without external dependencies
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error('Failed to parse JWT:', e)
    return null
  }
}

export const useWebSocketAuth = (
  sendJsonMessage: (msg: AuthMessage) => void,
) => {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  // Use a ref to store the token to avoid re-renders
  const authTokenRef = useRef<string | null>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const refreshToken = useCallback(async () => {
    try {
      const newToken = await getToken()
      // Compare the new token with the value in the ref
      if (newToken && newToken !== authTokenRef.current) {
        authTokenRef.current = newToken // Update the ref's value

        // Send the auth message immediately after getting a new token
        if (userId) {
          sendJsonMessage({
            event: 'auth',
            data: { userId, token: newToken },
          })
        }

        const decoded = parseJwt(newToken)
        if (!decoded || !decoded.exp) {
          console.error('Could not get token expiration')
          return
        }

        const expiryTime = decoded.exp * 1000
        const now = Date.now()
        const timeUntilExpiry = expiryTime - now
        const refreshIn = Math.max(timeUntilExpiry - 10000, 1000)

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = setTimeout(refreshToken, refreshIn)
      }
    } catch (error) {
      console.error('Error refreshing token', error)
      refreshTimeoutRef.current = setTimeout(refreshToken, 5000)
    }
    // The dependency array is now stable and won't cause a loop
  }, [getToken, userId, sendJsonMessage])

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSignedIn) {
        refreshToken()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSignedIn, refreshToken])

  // This effect now has a stable refreshToken dependency and will only run
  // when the user's auth state actually changes.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshToken()
    }
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [isLoaded, isSignedIn, refreshToken])

  // We no longer need the third useEffect that listened for state changes
  return { isSignedIn, userId }
}
