'use client'

import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { Message } from '@edenlabs/eden-sdk'
import { useEffect } from 'react'

interface SessionWebSocketMessage {
  event: string
  data: {
    newMessages?: Message[]
    session_id?: string
    title?: string
  }
}

export function useSessionWebSocket({
  sessionId,
  enabled = true,
}: {
  sessionId?: string
  enabled?: boolean
}) {
  const { lastMessageJson } = useWebSocketContext()
  const { addOrUpdateMessage } = useSessionQuery({
    sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

  useEffect(() => {
    console.log('useSessionWebSocket', sessionId, enabled, lastMessageJson)

    if (!enabled || !sessionId || !lastMessageJson) return

    // Only process session-update events
    if (lastMessageJson.event !== 'session-update') return

    const wsMessage = lastMessageJson as SessionWebSocketMessage
    const { newMessages, session_id } = wsMessage.data

    // Only process messages for the current session
    if (session_id !== sessionId) {
      return
    }

    // If we have new messages, update the query cache
    if (newMessages?.length) {
      for (const newMessage of newMessages) {
        addOrUpdateMessage(newMessage)
      }
    }
  }, [lastMessageJson, sessionId, enabled, addOrUpdateMessage])
}
