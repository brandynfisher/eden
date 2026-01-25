'use client'

import { AssistantMessage } from '@/features/sessions/components/assistant-message'
import { Message } from '@edenlabs/eden-sdk'
import { useEffect } from 'react'

interface StreamingMessageDisplayProps {
  sessionId: string
  isChatRoute?: boolean
  showAvatar?: boolean
  isStreamingTokens: boolean
  waitingForWebSocket: boolean
  streamingText: string
  hasReceivedTokens: boolean
  suppressTypingIndicator?: boolean
  hideWhileEmpty?: boolean
  matchingMessageExists?: boolean
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
  streamingMessageId?: string | null
  onStreamingComplete: () => void
}

export const StreamingMessageDisplay = ({
  sessionId,
  isChatRoute = false,
  showAvatar = true,
  isStreamingTokens,
  waitingForWebSocket,
  streamingText,
  hasReceivedTokens,
  suppressTypingIndicator = false,
  hideWhileEmpty = false,
  matchingMessageExists,
  getRespondingAgent,
  filteredMessages,
  streamingMessageId,
  onStreamingComplete,
}: StreamingMessageDisplayProps) => {
  // Clear streaming state when the real message is actually being rendered
  useEffect(() => {
    if (
      waitingForWebSocket &&
      streamingMessageId &&
      filteredMessages.length > 0
    ) {
      const matchingMessage = filteredMessages.find(
        msg =>
          msg.content === streamingMessageId &&
          msg.role === 'assistant' &&
          filteredMessages.indexOf(msg) >=
            Math.max(0, filteredMessages.length - 3),
      )

      if (matchingMessage) {
        onStreamingComplete()
      }
    }
  }, [
    filteredMessages,
    waitingForWebSocket,
    streamingMessageId,
    onStreamingComplete,
  ])

  const fallbackMatch =
    waitingForWebSocket &&
    streamingMessageId &&
    filteredMessages.find(
      msg =>
        ((msg as { _id?: string })._id === streamingMessageId ||
          (msg as { id?: string }).id === streamingMessageId ||
          msg.content === streamingMessageId) &&
        msg.role === 'assistant',
    )
  const messageAlreadyRendered = matchingMessageExists ?? Boolean(fallbackMatch)

  // Don't show if the real message is already in filtered messages
  const shouldShow =
    (hasReceivedTokens || waitingForWebSocket || streamingText.length > 0) &&
    !messageAlreadyRendered

  if (
    !shouldShow ||
    (hideWhileEmpty && streamingText.length === 0 && !hasReceivedTokens)
  ) {
    return null
  }

  return (
    <div className="transition-colors duration-500">
      <AssistantMessage
        sessionId={sessionId}
        message={
          {
            _id: 'streaming',
            session: [] as Message['session'],
            content: streamingText,
            sender: getRespondingAgent(),
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'assistant',
          } as Message
        }
        showAvatar={showAvatar}
        suppressTypingIndicator={suppressTypingIndicator}
        isStreamingTokens={waitingForWebSocket || isStreamingTokens}
        isChatRoute={isChatRoute}
      />
    </div>
  )
}
