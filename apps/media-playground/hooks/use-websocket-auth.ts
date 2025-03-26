'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const refreshToken = useCallback(async () => {
    try {
      const newToken = await getToken()
      if (newToken && newToken !== currentAuthToken) {
        const decoded = parseJwt(newToken)
        if (!decoded || !decoded.exp) {
          console.error('Could not get token expiration')
          return
        }

        // Get expiration time in milliseconds
        const expiryTime = decoded.exp * 1000
        const now = Date.now()
        const timeUntilExpiry = expiryTime - now

        // Schedule refresh for 10 seconds before expiry
        // But no less than 1 second from now
        const refreshIn = Math.max(timeUntilExpiry - 10000, 1000)

        setCurrentAuthToken(newToken)

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        console.log(
          `Token expires in ${timeUntilExpiry / 1000}s, scheduling refresh in ${
            refreshIn / 1000
          }s`,
        )
        refreshTimeoutRef.current = setTimeout(refreshToken, refreshIn)
      }
    } catch (error) {
      console.error('Error refreshing token', error)
      // On error, try again in 5 seconds
      refreshTimeoutRef.current = setTimeout(refreshToken, 5000)
    }
  }, [getToken, currentAuthToken])

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

  useEffect(() => {
    if (currentAuthToken && userId) {
      sendJsonMessage({
        event: 'auth',
        data: { userId, token: currentAuthToken },
      })
    }
  }, [currentAuthToken, userId, sendJsonMessage])

  return { isSignedIn, userId }
}
