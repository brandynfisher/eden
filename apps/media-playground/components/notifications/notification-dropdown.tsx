'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotificationContext } from '@/providers/notification-provider'
import { useAuth } from '@clerk/nextjs'
import { formatDistanceToNow } from 'date-fns'
import {
  ArchiveIcon,
  BellIcon,
  CheckCheckIcon,
  ExternalLinkIcon,
  InboxIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const NotificationDropdown = () => {
  const { isSignedIn } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    archiveNotifications,
    refreshNotifications,
  } = useNotificationContext()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      void refreshNotifications()
    }
  }, [open, refreshNotifications])

  if (!isSignedIn) {
    return null
  }

  const handleNotificationClick = async (
    id: string,
    actionUrl?: string | null,
    sessionId?: string | null,
  ) => {
    setBusyId(id)
    try {
      await markAsRead([id])
      if (actionUrl) {
        if (actionUrl.startsWith('http')) {
          window.open(actionUrl, '_blank')
        } else {
          router.push(actionUrl)
        }
      } else if (sessionId) {
        router.push(`/sessions/${sessionId}`)
      }
    } finally {
      setBusyId(current => (current === id ? null : current))
    }
  }

  const handleArchive = async (id: string) => {
    setBusyId(id)
    try {
      await archiveNotifications([id])
    } finally {
      setBusyId(current => (current === id ? null : current))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative px-2 focus:!ring-0 h-10 w-10"
          title="View notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 h-4 min-w-[18px] rounded-full bg-destructive text-[10px] font-semibold text-white leading-none flex items-center justify-center px-1 shadow border border-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[320px] sm:w-[360px] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Recent tasks, mentions, and alerts
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => void refreshNotifications()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={unreadCount === 0}
              onClick={() => void markAsRead()}
              title="Mark all read"
            >
              <CheckCheckIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
              <InboxIcon className="h-6 w-6" />
              <div>You're all caught up</div>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const createdAt = new Date(notification.createdAt)
                const relativeTime = formatDistanceToNow(createdAt, {
                  addSuffix: true,
                })
                const isPending = busyId === notification._id
                return (
                  <div
                    key={notification._id}
                    className={cn(
                      'px-4 py-3 text-sm transition-colors',
                      notification.read ? 'bg-background' : 'bg-muted/30',
                      'hover:bg-muted cursor-pointer',
                    )}
                    onClick={() =>
                      void handleNotificationClick(
                        notification._id,
                        notification.action_url || undefined,
                        notification.session || undefined,
                      )
                    }
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                          notification.read
                            ? 'bg-muted-foreground/40'
                            : 'bg-primary',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {notification.title || 'Notification'}
                          </p>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {relativeTime}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                          {notification.message}
                        </p>
                        {notification.agent?.name ? (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Agent: {notification.agent.name}
                          </p>
                        ) : null}
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={event => {
                              event.stopPropagation()
                              void handleNotificationClick(
                                notification._id,
                                notification.action_url || undefined,
                                notification.session || undefined,
                              )
                            }}
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
                            )}
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            disabled={isPending}
                            onClick={event => {
                              event.stopPropagation()
                              void handleArchive(notification._id)
                            }}
                          >
                            <ArchiveIcon className="h-3.5 w-3.5 mr-1" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationDropdown
