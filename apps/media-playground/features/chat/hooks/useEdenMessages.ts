import { ReadyState } from '@/hooks/use-shared-websocket-worker'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const { readyState } = useWebSocketContext()
  const lastConnectionStateRef = useRef<ReadyState>(readyState)
  const pendingOptimisticMessagesRef = useRef<TMessage[]>([])

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      setMessages(currentMessages => {
        let updatedMessages = [...currentMessages]
        const fiveSeconds = 5 * 1000

        // --- START: Check if incoming is a real message replacing a temp one ---
        const isRealUserMessage =
          message.role === 'user' && !message.id.startsWith('temp-')
        let tempDuplicateIndex = -1

        if (isRealUserMessage) {
          tempDuplicateIndex = updatedMessages.findIndex(
            m =>
              m.role === 'user' &&
              m.id.startsWith('temp-') &&
              m.content === message.content &&
              Math.abs(
                new Date(m.createdAt).getTime() -
                  new Date(message.createdAt).getTime(),
              ) < fiveSeconds,
          )

          if (tempDuplicateIndex !== -1) {
            console.log(
              'useEdenMessages: Removing temporary duplicate for incoming real message',
              {
                tempId: updatedMessages[tempDuplicateIndex].id,
                realId: message.id,
                content: message.content,
              },
            )
            updatedMessages.splice(tempDuplicateIndex, 1)
          }
        }
        // --- END: Check for real message replacing temp one ---

        // Check if the stream just finished (activeIds provided and is empty)
        const streamJustFinished =
          activeIds !== undefined && activeIds.length === 0

        if (streamJustFinished) {
          // Mark any remaining running assistant messages as complete
          updatedMessages = updatedMessages.map(m => {
            if (m.role === 'assistant' && m.status?.type === 'running') {
              return {
                ...m,
                status: { type: 'complete', reason: 'stop' },
              }
            }
            return m
          })
        }

        // Find existing message by ID (handles both temp and real IDs)
        const existingMessageIndex = updatedMessages.findIndex(
          m => m.id === message.id,
        )

        if (existingMessageIndex !== -1) {
          // Replace existing message
          const newStatus = streamJustFinished
            ? { type: 'complete' as const, reason: 'stop' as const }
            : message.status

          updatedMessages[existingMessageIndex] = {
            ...updatedMessages[existingMessageIndex], // Keep existing data
            ...message, // Overwrite with new data (including potentially real ID)
            tool_calls:
              message.tool_calls ||
              updatedMessages[existingMessageIndex].tool_calls,
            status: newStatus,
          }
          return updatedMessages
        } else {
          // Add new message
          const isAssistant = message.role === 'assistant'
          const calculatedStatus = streamJustFinished
            ? { type: 'complete' as const, reason: 'stop' as const }
            : message.status ||
              (isAssistant ? { type: 'running' as const } : undefined)

          const messageToAdd = {
            ...message,
            ...(calculatedStatus && { status: calculatedStatus }),
          }

          // If it's an optimistic assistant message, store it in pendingOptimisticMessages
          if (isAssistant && !streamJustFinished) {
            pendingOptimisticMessagesRef.current.push(messageToAdd)
          }

          updatedMessages.push(messageToAdd)
        }

        // If stream finished, clear pending optimistic messages
        if (streamJustFinished) {
          pendingOptimisticMessagesRef.current = []
        }

        return updatedMessages
      })
    },
    [],
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
        // Mark all running messages as complete with error
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'error' } }
              : m,
          ),
        )
      }

      // When connection is restored, reapply any pending optimistic messages
      if (
        readyState === ReadyState.OPEN &&
        pendingOptimisticMessagesRef.current.length > 0
      ) {
        console.log('Reapplying optimistic messages after reconnection', {
          count: pendingOptimisticMessagesRef.current.length,
        })
        pendingOptimisticMessagesRef.current.forEach(msg => {
          addOrUpdateMessage(msg)
        })
      }
    }
  }, [readyState, addOrUpdateMessage])

  // Check for pending message in localStorage on mount
  // REMOVED UseEffect for pending message

  // Wrap setMessages to properly handle active messages when switching threads
  const setMessagesWithActive = useCallback(
    (
      newMessages: TMessage[] | ((prev: TMessage[]) => TMessage[]),
      // activeIds?: string[],
    ) => {
      // Reset active message IDs when setting new messages
      if (Array.isArray(newMessages)) {
        // Set messages in a single batch update
        setMessages(newMessages)
      } else {
        // Handle function updates
        setMessages(prev => {
          const nextMessages = newMessages(prev)
          // console.log(
          //   'useEdenMessages.setMessagesWithActive - function update',
          //   {
          //     prevCount: prev.length,
          //     nextCount: nextMessages.length,
          //   },
          // )

          // Update active IDs based on the new messages
          // if (activeIds !== undefined) {
          // console.log(
          //   'useEdenMessages.setMessagesWithActive - using provided active (function)',
          //   {
          //     activeIds,
          //   },
          // )
          // setActiveMessageIds(activeIds)
          // } else {
          // const runningMessageIds = nextMessages
          //   .filter(
          //     (msg: TMessage) =>
          //       msg.role === 'assistant' &&
          //       (msg.status?.type === 'running' ||
          //         msg.tool_calls?.some(
          //           (call: { status?: string }) =>
          //             !call.status ||
          //             call.status === 'running' ||
          //             call.status === 'pending',
          //         )),
          //   )
          //   .map((msg: TMessage) => msg.id)

          // const newActiveIds = runningMessageIds
          // console.log(
          //   'useEdenMessages.setMessagesWithActive - computed active (function)',
          //   {
          //     runningMessageIds,
          //     newActiveIds,
          //   },
          // )
          // setActiveMessageIds(newActiveIds)
          // }

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
      // Clear any existing pending optimistic messages
      pendingOptimisticMessagesRef.current = []

      console.log('sendMessage', {
        newMessages,
      })
      // Add new messages optimistically with running status for assistant messages
      newMessages.forEach(message => {
        const messageWithStatus = {
          ...message,
          status:
            message.role === 'assistant' ? { type: 'running' } : undefined,
        }
        console.log('sendMessage adding optimistic message', {
          messageWithStatus,
        })
        addOrUpdateMessage(messageWithStatus as TMessage)

        if (message.role === 'user') {
          const dummyAssistantMessage = {
            status: { type: 'running' },
            role: 'assistant',
            id: 'temp-123',
            content: '',
          } as TMessage
          console.log('sendMessage adding temp assistant message', {
            message: dummyAssistantMessage,
          })
          addOrUpdateMessage(dummyAssistantMessage)
        }
      })

      console.log('sendMessage after adding optimistic messages', {
        newMessages,
      })

      try {
        const response = await stream(newMessages, callback)

        for await (const message of response) {
          const activeIds = message.data.active
          console.log('sendMessage after stream - adding message', {
            message: message.data,
            activeIds,
          })
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
        // Clear pending optimistic messages on error
        pendingOptimisticMessagesRef.current = []
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
