import { formatDuration } from '@/lib/strings'
import { PlayIcon } from 'lucide-react'

export const VideoDurationBadge = ({ duration }: { duration?: number }) => {
  return (
    <div className="absolute inset-0 rounded-full h-8 flex justify-center items-center pointer-events-none">
      <div className="text-xs text-popover-foreground bg-opacity-70 text-opacity-85 flex items-center bg-popover px-2 py-1 rounded-xl">
        <PlayIcon className="mr-1 h-3 w-3" />
        <div>{duration ? formatDuration(duration) : '0:00'}</div>
      </div>
    </div>
  )
}
