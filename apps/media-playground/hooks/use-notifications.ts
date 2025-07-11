'use client'

import { fetcher } from '@/lib/fetcher'
import { Notification, NotificationsListResponse } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useState } from 'react'

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  markAsRead: (notificationIds?: string[]) => Promise<void>
  archiveNotifications: (notificationIds: string[]) => Promise<void>
  refreshNotifications: () => Promise<void>
}

export const useNotifications = (
  enabled: boolean = true,
): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setIsError(false)

    try {
      // Fetch recent notifications (unarchived, limit 50)
      const url = new URL('/api/v2/notifications', window.location.origin)
      url.searchParams.set('include_archived', 'false')
      url.searchParams.set('limit', '50')
      url.searchParams.set('offset', '0')

      const response = await fetcher<NotificationsListResponse>(url.toString())

      setNotifications(response.notifications)
      setUnreadCount(response.unread_count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      try {
        await fetcher('/api/v2/notifications/read', {
          method: 'PATCH',
          body: JSON.stringify({
            notification_ids: notificationIds,
          }),
        })

        // Update local state
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(notification =>
              notificationIds.includes(notification._id)
                ? { ...notification, read: true, read_at: new Date() }
                : notification,
            ),
          )
          // Decrease unread count by the number of notifications marked as read
          const unreadInSelection = notifications.filter(
            n => notificationIds.includes(n._id) && !n.read,
          ).length
          setUnreadCount(prev => Math.max(0, prev - unreadInSelection))
        } else {
          // Mark all as read
          setNotifications(prev =>
            prev.map(notification => ({
              ...notification,
              read: true,
              read_at: new Date(),
            })),
          )
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    },
    [notifications],
  )

  const archiveNotifications = useCallback(
    async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return

      try {
        await fetcher('/api/v2/notifications/archive', {
          method: 'PATCH',
          body: JSON.stringify({
            notification_ids: notificationIds,
          }),
        })

        // Remove archived notifications from local state
        setNotifications(prev =>
          prev.filter(
            notification => !notificationIds.includes(notification._id),
          ),
        )

        // Update unread count
        const archivedUnreadCount = notifications.filter(
          n => notificationIds.includes(n._id) && !n.read,
        ).length
        setUnreadCount(prev => Math.max(0, prev - archivedUnreadCount))
      } catch (error) {
        console.error('Failed to archive notifications:', error)
      }
    },
    [notifications],
  )

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchNotifications()

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAsRead,
    archiveNotifications,
    refreshNotifications,
  }
}
