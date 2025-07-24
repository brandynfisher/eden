'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MicIcon, SquareIcon } from 'lucide-react'

type LiveRecordingIndicatorProps = {
  isRecording: boolean
  isProcessing?: boolean
  onStop: () => void
  className?: string
  actionIntervalProgress?: number
}

export const LiveRecordingIndicator = ({
  isRecording,
  isProcessing = false,
  onStop,
  className,
  actionIntervalProgress = 0,
}: LiveRecordingIndicatorProps) => {
  if (!isRecording && !isProcessing) return null

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden',
        className
      )}
    >
      {isRecording && !isProcessing && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-red-200/30 dark:from-red-500/30 dark:to-red-700/15 transition-all duration-100 ease-linear border-r border-red-300/50 dark:border-red-600/30"
          style={{ width: `${actionIntervalProgress}%` }}
        />
      )}
      
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <MicIcon className="w-4 h-4 text-red-600" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium text-red-700 dark:text-red-300">
          {isProcessing ? 'Processing audio...' : 'Live recording active'}
        </span>
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onStop}
        className="relative ml-auto h-7 px-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        <SquareIcon className="w-3 h-3 mr-1 fill-current" />
        Stop Recording
      </Button>
    </div>
  )
}