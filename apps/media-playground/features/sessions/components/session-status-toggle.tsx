'use client'

import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { SessionStatus } from '@edenlabs/eden-sdk'
import { Pause, Play } from 'lucide-react'
import { useState } from 'react'

interface SessionStatusToggleProps {
  sessionId: string
  currentStatus: SessionStatus
  onStatusChange?: (newStatus: SessionStatus) => void
  className?: string
  iconOnly?: boolean
}

export function SessionStatusToggle({
  sessionId,
  currentStatus,
  onStatusChange,
  className,
  iconOnly = false,
}: SessionStatusToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState<SessionStatus>(currentStatus)
  const { toast } = useToast()

  const handleToggle = async () => {
    const newStatus: SessionStatus = status === 'paused' ? 'active' : 'paused'

    try {
      setIsUpdating(true)

      // Send request to compute API to handle session status change
      const response = await fetch('/api/sessions/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update session status')
      }

      const result = await response.json()

      // Commented out: Direct MongoDB update
      // const response = await fetch(`/api/sessions/${sessionId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     status: newStatus,
      //   }),
      // })

      // Check if the compute API returned success
      if (result.success) {
        setStatus(newStatus)
        onStatusChange?.(newStatus)

        toast({
          title: newStatus === 'active' ? 'Session started' : 'Session paused',
          description:
            newStatus === 'active'
              ? 'The session is now active'
              : 'The session has been paused',
        })
      } else {
        // Handle failure from compute API
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
  }

  const isPaused = status === 'paused'
  const Icon = isPaused ? Play : Pause

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={cn(
        iconOnly
          ? 'h-9 w-9 rounded-md transition-colors flex items-center justify-center'
          : 'h-8 px-3 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
        isPaused
          ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950'
          : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-950',
        isUpdating && 'opacity-50 cursor-not-allowed',
        className,
      )}
      title={isPaused ? 'Start session' : 'Pause session'}
    >
      <Icon className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {!iconOnly && (isPaused ? 'Start' : 'Pause')}
    </button>
  )
}
