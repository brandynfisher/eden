'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect } from 'react'

export interface SessionNotification {
  _id: string
  session: string
  type: string
  read: boolean
  createdAt: string
}

/**
 * Hook to query and track unread session message notifications
 * Returns a Map of session_id -> unread_count
 */
export const useSessionNotificationsQuery = () => {
  const { user } = useAuthState()
  const { lastMessageJson } = useWebSocketContext()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['session-notifications', user?.userId],
    queryFn: async () => {
      const response = await axios.get<{
        notifications: SessionNotification[]
        total_count: number
        unread_count: number
      }>('/api/notifications', {
        params: {
          type: 'session_message',
          read: false,
          limit: 100, // Maximum allowed by API
        },
      })

      // Group notifications by session_id and count them
      const countsBySession = new Map<string, number>()
      response.data.notifications.forEach(notif => {
        const currentCount = countsBySession.get(notif.session) || 0
        countsBySession.set(notif.session, currentCount + 1)
      })

      return countsBySession
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    staleTime: 10000, // Consider data stale after 10 seconds
  })

  // Listen for WebSocket updates to invalidate and refetch
  useEffect(() => {
    if (!lastMessageJson) return

    // Invalidate when notifications are cleared
    if (lastMessageJson.event === 'notification-cleared') {
      queryClient.invalidateQueries({
        queryKey: ['session-notifications'],
      })
    }

    // Invalidate when new notification is created
    if (lastMessageJson.event === 'notification-created') {
      queryClient.invalidateQueries({
        queryKey: ['session-notifications'],
      })
    }

    // Invalidate when new session update comes through (might have new message)
    if (lastMessageJson.event === 'session-update') {
      queryClient.invalidateQueries({
        queryKey: ['session-notifications'],
      })
    }
  }, [lastMessageJson, queryClient])

  return query
}
