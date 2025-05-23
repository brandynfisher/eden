'use client'

import { useWebSocketContext } from '@/providers/websocket-provider'
import { Message, SessionV2 } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

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
      queryClient.setQueryData(['session', sessionId], (oldData: SessionV2) => {
        if (!oldData) return oldData

        // Get existing messages
        const existingMessages = oldData.messages || []
        const updatedMessages = [...existingMessages]

        // Add or update each new message
        for (const newMessage of newMessages) {
          const existingMessageIndex = updatedMessages.findIndex(
            (m: Message) => m._id === newMessage._id,
          )

          if (existingMessageIndex === -1) {
            // New message - add it to the end
            updatedMessages.push(newMessage)
          } else {
            // Existing message - update it
            updatedMessages[existingMessageIndex] = {
              ...updatedMessages[existingMessageIndex],
              ...newMessage,
            }
          }
        }

        return {
          ...oldData,
          messages: updatedMessages,
        }
      })
    }
  }, [lastMessageJson, sessionId, enabled, queryClient])
}
