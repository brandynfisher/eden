'use client'

import { SessionType, SessionV2 } from '@edenlabs/eden-sdk'
import confetti from 'canvas-confetti'
import { useEffect, useRef } from 'react'

type UseSessionCompletionConfettiOptions = {
  session: SessionV2 | undefined
  isLoading: boolean
}

/**
 * Fires a cheesy confetti animation when an automatic session
 * with a conductor_finish outcome is loaded for the first time.
 */
export const useSessionCompletionConfetti = ({
  session,
  isLoading,
}: UseSessionCompletionConfettiOptions) => {
  const hasFiredRef = useRef(false)

  useEffect(() => {
    // Only fire once per page load
    if (hasFiredRef.current) return

    // Wait until session is loaded
    if (isLoading || !session) return

    // Check if this is an automatic session
    if (session.session_type !== SessionType.AUTOMATIC) return

    // Check if there's a conductor_finish or moderator_finish message with content (outcome)
    const hasFinishMessage = session.messages?.some(message => {
      const messageType = message.eden_message_data?.message_type
        ? String(message.eden_message_data.message_type)
        : null
      return (
        (messageType === 'conductor_finish' ||
          messageType === 'moderator_finish') &&
        message.content?.trim()
      )
    })

    if (!hasFinishMessage) return

    // Fire confetti!
    hasFiredRef.current = true
    fireConfetti()
  }, [session, isLoading])
}

function fireConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Confetti from the left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })
    // Confetti from the right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)
}
