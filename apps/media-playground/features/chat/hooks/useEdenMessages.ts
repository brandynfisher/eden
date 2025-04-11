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
  // const [activeMessageIds, setActiveMessageIds] = useState<string[]>([])
  const { readyState } = useWebSocketContext()
  const lastConnectionStateRef = useRef<ReadyState>(readyState)

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
            : message.status
          const finalStatus = isAssistant ? calculatedStatus : undefined

          const messageToAdd = {
            ...message,
            ...(finalStatus && { status: finalStatus }),
          }

          return [...updatedMessages, messageToAdd]
        }
      })
    },
    [], // Keep dependencies empty as setMessages handles state correctly
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
        // setActiveMessageIds([])
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
      // console.log('sendMessage', newMessages)
      // Reset active message IDs when starting a new message chain
      // setActiveMessageIds([])

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
          // console.log('addOrUpdateMessage', message)
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
        // setActiveMessageIds([])
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
