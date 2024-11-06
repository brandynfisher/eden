'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

type AuthMessage = {
  event: 'auth'
  data: {
    userId: string
    token: string
  }
}

export const useWebSocketAuth = (
  sendJsonMessage: (msg: AuthMessage) => void,
) => {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const [currentAuthToken, setCurrentAuthToken] = useState<string | null>(null)

  const refreshToken = useCallback(async () => {
    const newToken = await getToken()
    if (newToken && newToken !== currentAuthToken) {
      setCurrentAuthToken(newToken)
    }
  }, [getToken, currentAuthToken])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshToken()
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

  useEffect(() => {
    const interval = setInterval(refreshToken, 25000)
    return () => clearInterval(interval)
  }, [refreshToken])

  return { isSignedIn, userId }
}
