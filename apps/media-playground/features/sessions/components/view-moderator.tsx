'use client'

import { cn } from '@/lib/utils'
import { ShieldCheckIcon } from 'lucide-react'

interface ViewModeratorProps {
  moderatorSessionId: string
  onOpenModerator: (sessionId: string) => void
  className?: string
}

export const ViewModerator = ({
  moderatorSessionId,
  onOpenModerator,
  className,
}: ViewModeratorProps) => {
  if (!moderatorSessionId) {
    return null
  }

  return (
    <button
      onClick={() => onOpenModerator(moderatorSessionId)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-blue-600 hover:bg-blue-500',
        'text-sm font-medium text-white transition-colors',
        'border border-blue-500/30',
        className,
      )}
    >
      <ShieldCheckIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Moderator Workspace</span>
    </button>
  )
}
