'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect } from 'react'

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

  // Mutation for marking session notifications as read with optimistic updates
  const markSessionAsReadMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await axios.patch(`/api/sessions/${sessionId}/mark-read`)
    },
    onMutate: async (sessionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['session-notifications', user?.userId],
      })

      // Snapshot the previous value
      const previousCounts = queryClient.getQueryData<Map<string, number>>([
        'session-notifications',
        user?.userId,
      ])

      // Optimistically update to remove the session's unread count
      queryClient.setQueryData<Map<string, number>>(
        ['session-notifications', user?.userId],
        old => {
          if (!old) return new Map()
          const newMap = new Map(old)
          newMap.delete(sessionId)
          return newMap
        },
      )

      // Return context with the previous value
      return { previousCounts }
    },
    onError: (_err, _sessionId, context) => {
      // Rollback on error
      if (context?.previousCounts) {
        queryClient.setQueryData(
          ['session-notifications', user?.userId],
          context.previousCounts,
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({
        queryKey: ['session-notifications'],
      })
    },
  })

  // Wrapper function for easier use
  const markSessionAsRead = useCallback(
    (sessionId: string) => {
      return markSessionAsReadMutation.mutateAsync(sessionId)
    },
    [markSessionAsReadMutation],
  )

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

  return { ...query, markSessionAsRead }
}
