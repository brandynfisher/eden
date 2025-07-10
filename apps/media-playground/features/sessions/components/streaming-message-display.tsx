'use client'

import { OtherMessage } from '@/features/sessions/components/other-message'
import { Message } from '@edenlabs/eden-sdk'
import { useEffect } from 'react'

interface StreamingMessageDisplayProps {
  sessionId: string
  isStreamingTokens: boolean
  waitingForWebSocket: boolean
  streamingText: string
  hasReceivedTokens: boolean
  streamingAgent: {
    _id: string
    username: string
    name: string
    userImage?: string
  } | null
  getRespondingAgent: () => {
    _id: string
    username: string
    name: string
    userImage?: string | undefined
  }
  filteredMessages: Message[]
  streamingMessageIdRef: React.MutableRefObject<string | null>
  onStreamingComplete: () => void
}

export const StreamingMessageDisplay: React.FC<StreamingMessageDisplayProps> = ({
  sessionId,
  isStreamingTokens,
  waitingForWebSocket,
  streamingText,
  hasReceivedTokens,
  getRespondingAgent,
  filteredMessages,
  streamingMessageIdRef,
  onStreamingComplete,
}) => {
  // Clear streaming state when the real message is actually being rendered
  useEffect(() => {
    if (
      waitingForWebSocket &&
      streamingMessageIdRef.current &&
      filteredMessages.length > 0
    ) {
      const matchingMessage = filteredMessages.find(
        msg =>
          msg.content === streamingMessageIdRef.current &&
          msg.role === 'assistant' &&
          filteredMessages.indexOf(msg) >=
            Math.max(0, filteredMessages.length - 3),
      )

      if (matchingMessage) {
        onStreamingComplete()
      }
    }
  }, [filteredMessages, waitingForWebSocket, streamingMessageIdRef, onStreamingComplete])

  // Don't show if the real message is already in filtered messages
  const shouldShow =
    (isStreamingTokens || waitingForWebSocket || streamingText.length > 0) &&
    !(
      waitingForWebSocket &&
      streamingMessageIdRef.current &&
      filteredMessages.find(
        msg =>
          msg.content === streamingMessageIdRef.current &&
          msg.role === 'assistant',
      )
    )

  if (!shouldShow) {
    return null
  }

  return (
    <div className="mb-4">
      <OtherMessage
        sessionId={sessionId}
        message={
          {
            _id: 'streaming',
            content: streamingText,
            sender: getRespondingAgent(),
            createdAt: new Date(),
            updatedAt: new Date(),
            session: sessionId,
            role: 'assistant',
          } as any
        }
        showAvatar={true}
        isStreamingTokens={isStreamingTokens && !hasReceivedTokens}
      />
    </div>
  )
}