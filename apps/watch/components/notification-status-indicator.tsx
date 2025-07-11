'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useNotificationContext } from '@/providers/notification-provider'
import {
  Notification,
  NotificationPriority,
  NotificationType,
} from '@edenlabs/eden-sdk'
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  ExternalLinkIcon,
  InboxIcon,
  InfoIcon,
  XIcon,
} from 'lucide-react'
import React, { useState } from 'react'

const NotificationStatusIndicator = () => {
  const { isAuthenticated } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    archiveNotifications,
  } = useNotificationContext()
  const [open, setOpen] = useState(false)

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  if (!isAuthenticated) {
    return null
  }

  const getNotificationIcon = (
    type: NotificationType,
    priority: NotificationPriority,
  ) => {
    const iconClass = 'mr-1.5 h-4 w-4'

    switch (type) {
      case NotificationType.TRIGGER_COMPLETED:
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case NotificationType.TRIGGER_FAILED:
        return <AlertTriangleIcon className={`${iconClass} text-red-500`} />
      case NotificationType.SESSION_COMPLETED:
        return <CheckCircleIcon className={`${iconClass} text-blue-500`} />
      case NotificationType.SESSION_FAILED:
        return <AlertCircleIcon className={`${iconClass} text-red-500`} />
      case NotificationType.SYSTEM_ALERT:
        return priority === NotificationPriority.HIGH ||
          priority === NotificationPriority.URGENT ? (
          <AlertTriangleIcon className={`${iconClass} text-orange-500`} />
        ) : (
          <InfoIcon className={`${iconClass} text-blue-500`} />
        )
      default:
        return <BellIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'border-l-4 border-red-500'
      case NotificationPriority.HIGH:
        return 'border-l-4 border-orange-500'
      case NotificationPriority.NORMAL:
        return 'border-l-4 border-blue-500'
      case NotificationPriority.LOW:
        return 'border-l-4 border-gray-300'
      default:
        return ''
    }
  }

  const handleMarkAsRead = async (notificationIds: string[]) => {
    await markAsRead(notificationIds)
  }

  const handleArchive = async (notificationIds: string[]) => {
    await archiveNotifications(notificationIds)
  }

  const handleMarkAllAsRead = async () => {
    await markAsRead()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger title="View notifications" asChild>
        <Button
          variant="ghost"
          className="flex px-2 gap-2 focus:!ring-0 relative"
        >
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && notifications.length === 0 && (
            <span className="text-sm">0</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-popover shadow-md rounded-md w-80 max-h-[500px] overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs px-2 py-1"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <DropdownMenuItem className="px-3 py-4 text-center text-muted-foreground">
              Loading notifications...
            </DropdownMenuItem>
          ) : notifications.length === 0 ? (
            <DropdownMenuItem className="px-3 py-4 text-center text-muted-foreground bg-muted/20 hover:bg-muted rounded cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <InboxIcon className="h-8 w-8 text-muted-foreground/50" />
                <span>No notifications</span>
              </div>
            </DropdownMenuItem>
          ) : (
            notifications.map(notification => (
              <div key={notification._id}>
                <DropdownMenuItem
                  className={`px-3 py-3 hover:bg-muted rounded cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  } ${getPriorityColor(notification.priority)}`}
                  asChild
                >
                  <div className="w-full">
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex items-start gap-2">
                        {getNotificationIcon(
                          notification.type,
                          notification.priority,
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">
                            {notification.title}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleMarkAsRead([notification._id])
                              }}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleArchive([notification._id])
                            }}
                            className="h-6 w-6 p-0"
                            title="Dismiss"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                                             <div className="flex items-center justify-between text-xs text-muted-foreground/50">
                         <span>
                           {formatTimeAgo(notification.created_at)}
                         </span>
                         {notification.related_trigger_id && (
                           <span className="text-xs bg-gray-100 px-1 rounded">
                             Trigger
                           </span>
                         )}
                       </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationStatusIndicator
