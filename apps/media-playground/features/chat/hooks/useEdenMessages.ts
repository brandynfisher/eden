import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useState } from 'react'

type MessageResponse<T> = {
  data: T & {
    active?: string[]
  }
}

type ThreadMessageWithStatus = ThreadMessage & {
  status?: AssistantMessage['status']
}

export const useEdenMessages = <TMessage extends ThreadMessageWithStatus>({
  stream,
}: {
  stream: (
    messages: TMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<MessageResponse<TMessage>>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])
  const [activeMessageIds, setActiveMessageIds] = useState<string[]>([])

  // Check for pending message in localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const threadId = window.location.pathname.split('/').pop()
    if (!threadId) return

    const pendingMessageKey = `pending-message-${threadId}`
    const pendingMessageData = localStorage.getItem(pendingMessageKey)

    if (pendingMessageData) {
      try {
        const messageData = JSON.parse(pendingMessageData)
        // Only use messages that are less than 5 minutes old
        if (Date.now() - messageData.timestamp < 5 * 60 * 1000) {
          // Add the pending message to the messages state
          const pendingMessage: ThreadMessage = {
            id: messageData.message_id,
            role: 'user',
            content: messageData.content,
            attachments: messageData.attachments || [],
            createdAt: new Date(messageData.timestamp),
          }

          setMessages(currentMessages => {
            // Check if message already exists to prevent duplication
            if (!currentMessages.some(m => m.id === messageData.message_id)) {
              return [...currentMessages, pendingMessage as TMessage]
            }
            return currentMessages
          })
        }
      } catch (e) {
        console.error('Error parsing pending message:', e)
      }
      // Clean up the pending message
      localStorage.removeItem(pendingMessageKey)
    }
  }, [])

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
        const messages = Array.isArray(newMessages)
          ? newMessages
          : newMessages([])

        // Check for pending messages in the new messages array
        const pendingMessageIds = messages
          .filter(msg => msg.role === 'user' && !msg.status)
          .map(msg => msg.id)

        const activeRootIds = messages.reduce<string[]>((acc, msg, index) => {
          if (msg.role !== 'assistant') return acc

          const isRunning =
            msg.status?.type === 'running' ||
            msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

          if (!isRunning) return acc

          const prevMsg = messages[index - 1]
          if (!prevMsg || prevMsg.role === 'user') {
            acc.push(msg.id)
          }

          return acc
        }, [])

        setActiveMessageIds([...activeRootIds, ...pendingMessageIds])
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
