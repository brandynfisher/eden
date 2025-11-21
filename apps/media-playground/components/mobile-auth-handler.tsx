/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useClerk } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function MobileAuthHandler() {
  const clerk = useClerk()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleToken = async (token: string) => {
      if (!token || hasProcessed.current) return

      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        const sessionId = decoded.sid
        if (!sessionId) return

        await clerk.setActive({ session: sessionId })
        hasProcessed.current = true
        window.history.replaceState({}, '', window.location.pathname)
      } catch (err) {
        console.error('MobileAuthHandler error:', err)
        hasProcessed.current = true
      }
    }

    // Poll for token in case it arrives late
    const interval = setInterval(() => {
      if ((window as any).__CLERK_TOKEN) {
        handleToken((window as any).__CLERK_TOKEN)
        ;(window as any).__CLERK_TOKEN = undefined
      }
    }, 500)

    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 5000)

    ;(window as any).handleMobileAuthToken = handleToken

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [clerk])

  return null
}
