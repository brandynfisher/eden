import { useWebSocketContext } from '@/providers/websocket-provider'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'

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
  const { readyState } = useWebSocketContext()
  const lastConnectionStateRef = useRef<ReadyState>(readyState)

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      console.log('useEdenMessages.addOrUpdateMessage - start', {
        messageId: message.id,
        role: message.role,
        status: message.status,
        activeIds,
        createdAt: message.createdAt,
      })

      // Only update active IDs if connection is open and they're provided
      if (activeIds !== undefined && readyState === ReadyState.OPEN) {
        console.log(
          'useEdenMessages.addOrUpdateMessage - updating active IDs',
          {
            activeIds,
          },
        )
        setActiveMessageIds(activeIds)
      }

      setMessages(currentMessages => {
        const index = currentMessages.findIndex(m => m.id === message.id)

        if (index !== -1) {
          // Check if the message content and status are identical
          const existingMessage = currentMessages[index]
          const isIdentical =
            existingMessage.content === message.content &&
            existingMessage.status?.type === message.status?.type &&
            existingMessage.status?.reason === message.status?.reason &&
            JSON.stringify(existingMessage.tool_calls) ===
              JSON.stringify(message.tool_calls)

          // If message is identical, don't update
          if (isIdentical) {
            console.log(
              'useEdenMessages.addOrUpdateMessage - identical, skipping',
              {
                messageId: message.id,
              },
            )
            return currentMessages
          }

          // Check if the new message is older than the existing one
          const existingDate = existingMessage.createdAt
            ? new Date(existingMessage.createdAt)
            : null
          const newDate = message.createdAt ? new Date(message.createdAt) : null
          if (existingDate && newDate && newDate < existingDate) {
            console.log(
              'useEdenMessages.addOrUpdateMessage - received older message, skipping',
              {
                messageId: message.id,
                existingDate,
                newDate,
              },
            )
            return currentMessages
          }

          // Update existing message while preserving tool_calls if they exist
          const updatedMessages = [...currentMessages]
          updatedMessages[index] = {
            ...existingMessage,
            ...message,
            // Preserve existing tool_calls if the new message doesn't have any
            tool_calls: message.tool_calls || existingMessage.tool_calls,
            // If message is in active array and is an assistant message, ensure it stays running
            status:
              activeIds?.includes(message.id) && message.role === 'assistant'
                ? { type: 'running' }
                : message.status,
          }
          console.log('useEdenMessages.addOrUpdateMessage - updated existing', {
            messageId: message.id,
            index,
            status: updatedMessages[index].status,
          })
          return updatedMessages
        }

        // When receiving a completion message, only complete messages that:
        // 1. Are not in the active array
        // 2. Are not the current message
        // 3. Are assistant messages
        const updatedMessages = currentMessages.map(m => {
          const isRunning = m.status?.type === 'running'
          const isCompletionMessage = message.status?.type === 'complete'
          const isActive =
            activeIds?.includes(m.id) || activeMessageIds.includes(m.id)
          const isCurrentMessage = m.id === message.id
          const isAssistant = m.role === 'assistant'

          if (
            isRunning &&
            !isActive &&
            !isCurrentMessage &&
            isCompletionMessage &&
            isAssistant
          ) {
            return { ...m, status: { type: 'complete', reason: 'stop' } }
          }
          return m
        })

        // For new messages:
        // 1. If it's in the active array and is an assistant message, it should be running
        // 2. If it's a reply to an active message and is an assistant message, it should be running
        // 3. If it's part of an active chain and is an assistant message, it should be running
        const isActive = activeIds?.includes(message.id)
        const isPartOfActiveChain =
          message.reply_to &&
          (activeIds?.includes(message.reply_to) ||
            activeMessageIds.includes(message.reply_to))
        const isAssistant = message.role === 'assistant'

        const messageToAdd = {
          ...message,
          status:
            isAssistant && (isActive || isPartOfActiveChain)
              ? { type: 'running' }
              : message.status,
        }

        console.log('useEdenMessages.addOrUpdateMessage - adding new', {
          messageId: message.id,
          isActive,
          isPartOfActiveChain,
          isAssistant,
          status: messageToAdd.status,
          createdAt: messageToAdd.createdAt,
        })

        // Add new message
        return [...updatedMessages, messageToAdd]
      })
    },
    [activeMessageIds, readyState],
  )

  // Reset active messages when connection is lost
  useEffect(() => {
    if (readyState !== lastConnectionStateRef.current) {
      lastConnectionStateRef.current = readyState

      // When connection is lost or closed
      if (
        readyState === ReadyState.CLOSED ||
        readyState === ReadyState.CLOSING
      ) {
        setActiveMessageIds([])
        // Mark all running messages as complete with error
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'error' } }
              : m,
          ),
        )
      }
    }
  }, [readyState])

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
          const pendingMessage = {
            id: messageData.message_id,
            role: 'user' as const,
            content: messageData.content,
            attachments: messageData.attachments || [],
            createdAt: new Date(messageData.timestamp),
          } as TMessage

          // Add message and mark it as active
          addOrUpdateMessage(pendingMessage, [messageData.message_id])
        }
      } catch (e) {
        console.error('Error parsing pending message:', e)
      }
      // Clean up the pending message
      localStorage.removeItem(pendingMessageKey)
    }
  }, [addOrUpdateMessage])

  // Wrap setMessages to properly handle active messages when switching threads
  const setMessagesWithActive = useCallback(
    (
      newMessages: TMessage[] | ((prev: TMessage[]) => TMessage[]),
      activeIds?: string[],
    ) => {
      console.log('useEdenMessages.setMessagesWithActive - start', {
        isArray: Array.isArray(newMessages),
        messageCount: Array.isArray(newMessages)
          ? newMessages.length
          : 'function',
        activeIds,
      })

      // Reset active message IDs when setting new messages
      if (Array.isArray(newMessages)) {
        // If activeIds is provided, use those directly
        if (activeIds !== undefined) {
          console.log(
            'useEdenMessages.setMessagesWithActive - using provided active',
            {
              activeIds,
            },
          )
          setActiveMessageIds(activeIds)
        } else {
          // Otherwise, scan messages for running ones
          const runningMessageIds = newMessages
            .filter(
              msg =>
                msg.role === 'assistant' &&
                (msg.status?.type === 'running' ||
                  msg.tool_calls?.some(
                    call =>
                      !call.status ||
                      call.status === 'running' ||
                      call.status === 'pending',
                  )),
            )
            .map(msg => msg.id)

          const newActiveIds = runningMessageIds
          console.log(
            'useEdenMessages.setMessagesWithActive - computed active',
            {
              runningMessageIds,
              newActiveIds,
            },
          )
          setActiveMessageIds(newActiveIds)
        }

        // Set messages in a single batch update
        setMessages(newMessages)
      } else {
        // Handle function updates
        setMessages(prev => {
          const nextMessages = newMessages(prev)
          console.log(
            'useEdenMessages.setMessagesWithActive - function update',
            {
              prevCount: prev.length,
              nextCount: nextMessages.length,
            },
          )

          // Update active IDs based on the new messages
          if (activeIds !== undefined) {
            console.log(
              'useEdenMessages.setMessagesWithActive - using provided active (function)',
              {
                activeIds,
              },
            )
            setActiveMessageIds(activeIds)
          } else {
            const runningMessageIds = nextMessages
              .filter(
                msg =>
                  msg.role === 'assistant' &&
                  (msg.status?.type === 'running' ||
                    msg.tool_calls?.some(
                      call =>
                        !call.status ||
                        call.status === 'running' ||
                        call.status === 'pending',
                    )),
              )
              .map(msg => msg.id)

            const newActiveIds = runningMessageIds
            console.log(
              'useEdenMessages.setMessagesWithActive - computed active (function)',
              {
                runningMessageIds,
                newActiveIds,
              },
            )
            setActiveMessageIds(newActiveIds)
          }

          return nextMessages
        })
      }
    },
    [],
  )

  const sendMessage = useCallback(
    async (
      newMessages: TMessage[],
      callback?: (thread_id?: string) => Promise<void>,
    ) => {
      console.log('sendMessage', newMessages)
      // Reset active message IDs when starting a new message chain
      setActiveMessageIds([])

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
