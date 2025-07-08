'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MicIcon, SquareIcon } from 'lucide-react'

type LiveRecordingIndicatorProps = {
  isRecording: boolean
  isProcessing?: boolean
  onStop: () => void
  className?: string
}

export const LiveRecordingIndicator = ({
  isRecording,
  isProcessing = false,
  onStop,
  className,
}: LiveRecordingIndicatorProps) => {
  if (!isRecording && !isProcessing) return null

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2">
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
        className="ml-auto h-7 px-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        <SquareIcon className="w-3 h-3 mr-1 fill-current" />
        Stop Recording
      </Button>
    </div>
  )
}