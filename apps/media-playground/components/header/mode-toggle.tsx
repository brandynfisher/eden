import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCircleIcon, SettingsIcon } from 'lucide-react'
import { FC } from 'react'

interface ModeToggleProps {
  mode: 'chat' | 'settings'
  onModeChange: (mode: 'chat' | 'settings') => void
  className?: string
  compact?: boolean
  variant?: 'default' | 'sidebar'
}

export const ModeToggle: FC<ModeToggleProps> = ({
  mode,
  onModeChange,
  className,
  compact = false,
  variant = 'default',
}) => {
  // Sidebar variant: clean, symmetrical with purple hue
  if (variant === 'sidebar') {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-0.5 p-0.5 rounded-lg bg-background',
          className,
        )}
      >
        {/* Chat button */}
        <Button
          variant="ghost"
          size="default"
          onClick={() => onModeChange('chat')}
          className={cn(
            'gap-1.5 transition-all justify-center h-10 w-full px-2 py-2 min-w-0 border-0',
            mode === 'chat'
              ? 'bg-primary/20 text-primary-foreground hover:bg-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <MessageCircleIcon className="size-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">Chat</span>
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="default"
          onClick={() => onModeChange('settings')}
          className={cn(
            'gap-1.5 transition-all justify-center h-10 w-full px-2 py-2 min-w-0 border-0',
            mode === 'settings'
              ? 'bg-primary/20 text-primary-foreground hover:bg-primary/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <SettingsIcon className="size-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">Settings</span>
        </Button>
      </div>
    )
  }

  // Default variant: compact segmented control
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-muted/30 p-1 gap-1',
        className,
      )}
    >
      {/* Chat button */}
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={() => onModeChange('chat')}
        className={cn(
          'gap-2 transition-all',
          compact ? 'h-8 px-3' : 'h-9 px-4',
          mode === 'chat'
            ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-transparent',
        )}
      >
        <MessageCircleIcon className={cn(compact ? 'size-3.5' : 'size-4')} />
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          Chat
        </span>
      </Button>

      {/* Settings button */}
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={() => onModeChange('settings')}
        className={cn(
          'gap-2 transition-all',
          compact ? 'h-8 px-3' : 'h-9 px-4',
          mode === 'settings'
            ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-transparent',
        )}
      >
        <SettingsIcon className={cn(compact ? 'size-3.5' : 'size-4')} />
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          Settings
        </span>
      </Button>
    </div>
  )
}
