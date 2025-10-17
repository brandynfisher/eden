'use client'

import axios from 'axios'
import { useEffect, useRef } from 'react'

/**
 * Hook to track when a user is actively viewing a session
 * This is used by the notification system to determine whether to create notifications
 */
export const useSessionTracking = (sessionId: string | undefined) => {
  const lastTrackedSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionId || sessionId === 'new') return

    const track = async () => {
      try {
        await axios.post('/api/sessions/track-view', { session_id: sessionId })
        lastTrackedSessionRef.current = sessionId
      } catch (error) {
        // Silently fail
      }
    }

    const untrack = async () => {
      if (lastTrackedSessionRef.current) {
        try {
          await axios.post('/api/sessions/untrack-view', {
            session_id: lastTrackedSessionRef.current,
          })
        } catch (error) {
          // Silently fail
        }
      }
    }

    // Track on mount and when window gains focus
    track()
    window.addEventListener('focus', track)

    // Untrack when window loses focus
    const handleBlur = () => {
      untrack()
    }
    window.addEventListener('blur', handleBlur)

    // Cleanup on unmount
    return () => {
      untrack()
      window.removeEventListener('focus', track)
      window.removeEventListener('blur', handleBlur)
    }
  }, [sessionId])
}
