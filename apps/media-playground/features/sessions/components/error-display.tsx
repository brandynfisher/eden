'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, CreditCard, RefreshCw, Wifi, X } from 'lucide-react'

export interface SessionError {
  id: string
  type:
    | 'budget_exceeded'
    | 'connection_error'
    | 'stream_error'
    | 'rate_limit'
    | 'generic'
  message: string
  recoveryAction?: {
    label: string
    action: () => void
  }
  dismissible?: boolean
}

interface ErrorDisplayProps {
  errors: SessionError[]
  onDismiss?: (errorId: string) => void
  className?: string
}

const errorConfig = {
  budget_exceeded: {
    icon: CreditCard,
    variant: 'destructive' as const,
    title: 'Budget Exceeded',
  },
  connection_error: {
    icon: Wifi,
    variant: 'destructive' as const,
    title: 'Connection Error',
  },
  stream_error: {
    icon: AlertTriangle,
    variant: 'destructive' as const,
    title: 'Stream Error',
  },
  rate_limit: {
    icon: AlertTriangle,
    variant: 'default' as const,
    title: 'Rate Limited',
  },
  generic: {
    icon: AlertTriangle,
    variant: 'destructive' as const,
    title: 'Error',
  },
}

export function ErrorDisplay({
  errors,
  onDismiss,
  className,
}: ErrorDisplayProps) {
  if (errors.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      {errors.map(error => {
        const config = errorConfig[error.type]
        const Icon = config.icon

        return (
          <Alert key={error.id} variant={config.variant} className="relative">
            <Icon className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">{config.title}</div>
              <AlertDescription className="mt-1">
                {error.message}
              </AlertDescription>
              {error.recoveryAction && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={error.recoveryAction.action}
                    className="h-8"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {error.recoveryAction.label}
                  </Button>
                </div>
              )}
            </div>
            {error.dismissible && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => onDismiss(error.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </Alert>
        )
      })}
    </div>
  )
}
