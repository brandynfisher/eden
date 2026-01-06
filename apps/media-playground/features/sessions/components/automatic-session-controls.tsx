'use client'

import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { SessionStatus, SessionV2 } from '@edenlabs/eden-sdk'
import { Loader2, Pause, Play, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface AutomaticSessionControlsProps {
  session: SessionV2
  onStatusChange?: (newStatus: SessionStatus) => void
  className?: string
}

/**
 * Formats seconds into a human-readable countdown string.
 * Examples: "45s", "2m 30s", "1h 5m"
 */
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
  }
  return `${secs}s`
}

export function AutomaticSessionControls({
  session,
  onStatusChange,
  className,
}: AutomaticSessionControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isNexting, setIsNexting] = useState(false)
  const [status, setStatus] = useState<SessionStatus>(session.status)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const { toast } = useToast()

  // Sync status with session prop
  useEffect(() => {
    setStatus(session.status)
  }, [session.status])

  // Calculate countdown based on waiting_until from server
  useEffect(() => {
    const isSessionRunningOrActive =
      status === 'active' || (status as string) === 'running'

    if (isSessionRunningOrActive && session.waiting_until) {
      // Use server-provided waiting_until for countdown
      const updateCountdown = () => {
        const waitingUntil = new Date(session.waiting_until!).getTime()
        const now = Date.now()
        const remainingSeconds = Math.max(
          0,
          Math.floor((waitingUntil - now) / 1000),
        )
        setCountdown(remainingSeconds)
      }

      // Update immediately
      updateCountdown()

      // Update every second
      countdownIntervalRef.current = setInterval(updateCountdown, 1000)
    } else if (status === 'paused') {
      // Clear countdown when paused
      setCountdown(null)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    } else if (isSessionRunningOrActive && !session.waiting_until) {
      // No waiting_until means currently executing a turn
      setCountdown(null)
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [status, session.waiting_until])

  const handleToggleStatus = useCallback(async () => {
    // If paused, start. If active or running, pause.
    const newStatus: SessionStatus = status === 'paused' ? 'active' : 'paused'

    try {
      setIsUpdating(true)

      const response = await fetch('/api/sessions/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session._id,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update session status')
      }

      const result = await response.json()

      if (result.success) {
        setStatus(newStatus)
        onStatusChange?.(newStatus)

        toast({
          title: newStatus === 'active' ? 'Session started' : 'Session paused',
          description:
            newStatus === 'active'
              ? 'The automatic session is now running'
              : 'The automatic session has been paused',
        })
      } else {
        throw new Error(result.error || 'Failed to update session status')
      }
    } catch (error) {
      console.error('Failed to toggle session status:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update session status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }, [session._id, status, onStatusChange, toast])

  const handleNextTurn = useCallback(async () => {
    try {
      setIsNexting(true)

      const response = await fetch('/api/sessions/next-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session._id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger next turn')
      }

      const result = await response.json()

      if (result.success) {
        // Clear countdown - server will provide new waiting_until
        setCountdown(null)

        toast({
          title: 'Next turn triggered',
          description: 'The next agent turn has been initiated',
        })
      } else {
        throw new Error(result.error || 'Failed to trigger next turn')
      }
    } catch (error) {
      console.error('Failed to trigger next turn:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to trigger next turn',
        variant: 'destructive',
      })
    } finally {
      setIsNexting(false)
    }
  }, [session._id, toast])

  const isPaused = status === 'paused'
  const isActive = status === 'active'
  // Note: 'running' status comes from eve but isn't in SDK types
  const isRunning = (status as string) === 'running'

  // Determine if we're waiting for next turn (has waiting_until) vs actively executing
  const isWaiting =
    (isActive || isRunning) && countdown !== null && countdown > 0
  const isExecuting = (isActive || isRunning) && countdown === null

  // Check if session has finished (has conductor_finish or moderator_finish message)
  const hasFinished = session.messages?.some(
    m =>
      m.eden_message_data?.message_type === 'conductor_finish' ||
      m.eden_message_data?.message_type === 'moderator_finish',
  )

  // Don't show controls if session has finished
  if (hasFinished) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      {isPaused ? (
        // Paused state - show big Start button
        <button
          onClick={handleToggleStatus}
          disabled={isUpdating}
          className={cn(
            'w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all',
            'bg-green-600 hover:bg-green-500 text-white',
            'flex items-center justify-center gap-3',
            'shadow-lg hover:shadow-xl',
            'border border-green-500/50',
            isUpdating && 'opacity-70 cursor-not-allowed',
          )}
        >
          <Play className="h-6 w-6" />
          {isUpdating ? 'Starting...' : 'Start Automatic Session'}
        </button>
      ) : isActive || isRunning ? (
        // Active/Running state - show Pause, countdown/running indicator, and Next buttons
        <div className="flex items-center gap-3">
          {/* Pause button - always available */}
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={cn(
              'flex-shrink-0 py-3 px-5 rounded-xl font-medium transition-all',
              'bg-yellow-600 hover:bg-yellow-500 text-white',
              'flex items-center gap-2',
              'shadow-md hover:shadow-lg',
              'border border-yellow-500/50',
              isUpdating && 'opacity-70 cursor-not-allowed',
            )}
          >
            <Pause className="h-5 w-5" />
            {isUpdating ? 'Pausing...' : 'Pause'}
          </button>

          {/* Center section - Running indicator or Countdown */}
          <div className="flex-1 text-center">
            {isExecuting ? (
              // Currently executing a turn - show running indicator
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                <span className="text-lg font-semibold text-green-500">
                  Running...
                </span>
              </div>
            ) : isWaiting ? (
              // Waiting for next turn - show countdown
              <>
                <div className="text-sm text-muted-foreground">
                  Next turn in
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {formatCountdown(countdown!)}
                </div>
              </>
            ) : null}
          </div>

          {/* Next button - disabled while executing */}
          <button
            onClick={handleNextTurn}
            disabled={isNexting || isUpdating || isExecuting}
            className={cn(
              'flex-shrink-0 py-3 px-5 rounded-xl font-medium transition-all',
              'bg-green-600 hover:bg-green-500 text-white',
              'flex items-center gap-2',
              'shadow-md hover:shadow-lg',
              'border border-green-500/50',
              (isNexting || isUpdating || isExecuting) &&
                'opacity-70 cursor-not-allowed',
            )}
          >
            <SkipForward className="h-5 w-5" />
            {isNexting ? 'Triggering...' : 'Next'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
