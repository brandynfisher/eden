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

  // Get delay interval from session settings (default to 60 seconds)
  const delayInterval = session.settings?.delay_interval || 60

  // Sync status with session prop
  useEffect(() => {
    setStatus(session.status)
  }, [session.status])

  // Start countdown when session is active (keep running during 'running' state too)
  // Note: 'running' status comes from eve but isn't in SDK types
  useEffect(() => {
    const isSessionRunningOrActive =
      status === 'active' || (status as string) === 'running'

    if (isSessionRunningOrActive && delayInterval > 0) {
      // Only start countdown if not already running
      if (countdownIntervalRef.current === null) {
        setCountdown(delayInterval)

        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              // Reset countdown when it reaches 0
              return delayInterval
            }
            return prev - 1
          })
        }, 1000)
      }
    } else if (status === 'paused') {
      // Clear countdown when paused
      setCountdown(null)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [status, delayInterval])

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
        // Reset countdown
        setCountdown(delayInterval)

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
  }, [session._id, delayInterval, toast])

  const isPaused = status === 'paused'
  const isActive = status === 'active'
  // Note: 'running' status comes from eve but isn't in SDK types
  const isRunning = (status as string) === 'running'

  // Check if session has finished (has conductor_finish message)
  const hasFinished = session.messages?.some(
    m => m.eden_message_data?.message_type === 'conductor_finish',
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
          {/* Pause button */}
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating || isRunning}
            className={cn(
              'flex-shrink-0 py-3 px-5 rounded-xl font-medium transition-all',
              'bg-yellow-600 hover:bg-yellow-500 text-white',
              'flex items-center gap-2',
              'shadow-md hover:shadow-lg',
              'border border-yellow-500/50',
              (isUpdating || isRunning) && 'opacity-70 cursor-not-allowed',
            )}
          >
            <Pause className="h-5 w-5" />
            {isUpdating ? 'Pausing...' : 'Pause'}
          </button>

          {/* Center section - Running indicator or Countdown */}
          <div className="flex-1 text-center">
            {isRunning ? (
              // Running state - show running indicator
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                <span className="text-lg font-semibold text-green-500">
                  Running...
                </span>
              </div>
            ) : delayInterval > 0 && countdown !== null ? (
              // Active state with countdown
              <>
                <div className="text-sm text-muted-foreground">
                  Next turn in
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {formatCountdown(countdown)}
                </div>
              </>
            ) : null}
          </div>

          {/* Next button */}
          <button
            onClick={handleNextTurn}
            disabled={isNexting || isUpdating || isRunning}
            className={cn(
              'flex-shrink-0 py-3 px-5 rounded-xl font-medium transition-all',
              'bg-green-600 hover:bg-green-500 text-white',
              'flex items-center gap-2',
              'shadow-md hover:shadow-lg',
              'border border-green-500/50',
              (isNexting || isUpdating || isRunning) &&
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
