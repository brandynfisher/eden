import { useCallback, useState } from 'react'

type ToolCallResult = {
  output: Array<{
    filename: string
    mediaAttributes?: {
      mimeType: string
      width: number
      height: number
      aspectRatio: number
      blurhash?: string
    }
    creation?: {
      mediaAttributes: {
        mimeType: string
        width: number
        height: number
        aspectRatio: number
        blurhash?: string
      }
      _id: string
      filename: string
      tool: string
      user: {
        _id: string
        username: string
        userImage?: string
      }
    }
  }>
  intermediate_outputs?: {
    controlnet_guidance?: Array<{
      filename: string
      mediaAttributes: {
        mimeType: string
        width: number
        height: number
        aspectRatio: number
        blurhash?: string
      }
    }>
  }
}

type MessageWithStatus = {
  id: string
  role?: string
  status?: { type: string; reason?: string }
  reply_to?: string
  content?: string
  tool_calls?: Array<{
    id: string
    tool: string
    args: Record<string, unknown>
    task?: string
    status?: string
    result?: ToolCallResult[]
  }>
}

type MessageResponse<T> = {
  data: T & {
    active?: string[]
  }
}

export const useEdenMessages = <TMessage extends MessageWithStatus>({
  stream,
}: {
  stream: (
    messages: TMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<MessageResponse<TMessage>>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])
  const [activeMessageIds, setActiveMessageIds] = useState<string[]>([])

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      if (activeIds !== undefined) {
        setActiveMessageIds(activeIds)
      }

      setMessages(currentMessages => {
        const index = currentMessages.findIndex(m => m.id === message.id)

        if (index !== -1) {
          // Update existing message while preserving tool_calls if they exist
          const updatedMessages = [...currentMessages]
          const existingMessage = currentMessages[index]
          updatedMessages[index] = {
            ...existingMessage,
            ...message,
            // Preserve existing tool_calls if the new message doesn't have any
            tool_calls: message.tool_calls || existingMessage.tool_calls,
          }
          return updatedMessages
        }

        // When receiving a completion message, only complete messages that:
        // 1. Are not in the active array
        // 2. Are not the current message
        const updatedMessages = currentMessages.map(m => {
          const isRunning = m.status?.type === 'running'
          const isCompletionMessage = message.status?.type === 'complete'
          const isActive =
            activeIds?.includes(m.id) || activeMessageIds.includes(m.id)
          const isCurrentMessage = m.id === message.id

          if (
            isRunning &&
            !isActive &&
            !isCurrentMessage &&
            isCompletionMessage
          ) {
            return { ...m, status: { type: 'complete', reason: 'stop' } }
          }
          return m
        })

        // For new messages:
        // 1. If it's a reply to an active message, it should be running
        // 2. If it's part of an active chain (reply_to points to active message), it should be running
        const isPartOfActiveChain =
          message.reply_to &&
          (activeIds?.includes(message.reply_to) ||
            activeMessageIds.includes(message.reply_to))

        const messageToAdd = {
          ...message,
          status: isPartOfActiveChain ? { type: 'running' } : message.status,
        }

        // Add new message
        return [...updatedMessages, messageToAdd]
      })
    },
    [activeMessageIds],
  )

  // Wrap setMessages to properly handle active messages when switching threads
  const setMessagesWithActive = useCallback(
    (
      newMessages: TMessage[] | ((prev: TMessage[]) => TMessage[]),
      activeIds?: string[],
    ) => {
      // If activeIds is provided, update activeMessageIds state
      if (activeIds !== undefined) {
        setActiveMessageIds(activeIds)
      } else {
        // If no activeIds provided, we need to identify active root messages
        // by finding assistant messages that:
        // 1. Have running status
        // 2. Are the first assistant message after a user message
        const messages = Array.isArray(newMessages)
          ? newMessages
          : newMessages([])

        const activeRootIds = messages.reduce<string[]>((acc, msg, index) => {
          // Only consider assistant messages
          if (msg.role !== 'assistant') return acc

          // Check if this message has running status or pending tool calls
          const isRunning =
            msg.status?.type === 'running' ||
            msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

          if (!isRunning) return acc

          // Find the previous message
          const prevMsg = messages[index - 1]

          // If this is a running assistant message and the previous message was from the user
          // (or this is the first message), it's a root message
          if (!prevMsg || prevMsg.role === 'user') {
            acc.push(msg.id)
          }

          return acc
        }, [])

        setActiveMessageIds(activeRootIds)
      }

      setMessages(newMessages)
    },
    [],
  )

  const sendMessage = useCallback(
    async (newMessages: TMessage[], callback?: () => Promise<void>) => {
      console.log('sendMessage', newMessages)
      // Add new messages optimistically with running status for assistant messages
      newMessages.forEach(message => {
        const messageWithStatus = {
          ...message,
          status:
            message.role === 'assistant' ? { type: 'running' } : undefined,
        }
        addOrUpdateMessage(messageWithStatus as TMessage)
      })

      try {
        const response = await stream(newMessages, callback)
        for await (const message of response) {
          console.log('addOrUpdateMessage', message)
          // Extract active IDs from the message if available
          const activeIds = message.data.active
          addOrUpdateMessage(message.data, activeIds)
        }
      } catch (error) {
        console.error('Error in message stream:', error)
        // Ensure any running messages are completed on error
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'error' } }
              : m,
          ),
        )
        setActiveMessageIds([])
      }
    },
    [addOrUpdateMessage],
  )

  return {
    messages,
    sendMessage,
    setMessages: setMessagesWithActive,
    addOrUpdateMessage,
  }
}
