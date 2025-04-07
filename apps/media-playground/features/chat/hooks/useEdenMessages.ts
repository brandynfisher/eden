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
  // const [activeMessageIds, setActiveMessageIds] = useState<string[]>([])
  const { readyState } = useWebSocketContext()
  const lastConnectionStateRef = useRef<ReadyState>(readyState)

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      // console.log('useEdenMessages.addOrUpdateMessage - start', {
      //   messageId: message.id,
      //   role: message.role,
      //   status: message.status,
      //   activeIds,
      //   createdAt: message.createdAt,
      //   content: message.content,
      // })

      // Update active IDs state if provided and connection is open
      // if (activeIds !== undefined && readyState === ReadyState.OPEN) {
      //   setActiveMessageIds(activeIds)
      // }

      setMessages(currentMessages => {
        let updatedMessages = [...currentMessages]

        // Check if the stream just finished (activeIds provided and is empty)
        const streamJustFinished =
          activeIds !== undefined && activeIds.length === 0

        if (streamJustFinished) {
          // Mark any remaining running assistant messages as complete
          updatedMessages = updatedMessages.map(m => {
            if (m.role === 'assistant' && m.status?.type === 'running') {
              // console.log(
              //   'useEdenMessages.addOrUpdateMessage - stream finished, marking running message as complete',
              //   {
              //     messageId: m.id,
              //   },
              // )
              return {
                ...m,
                status: { type: 'complete', reason: 'stop' },
              }
            }
            return m
          })
        }

        // Find any matching messages using existing logic
        const matchingMessages = updatedMessages.filter(
          m =>
            m.id === message.id ||
            (m.id.startsWith('temp-') &&
              message.id.startsWith('temp-') &&
              m.content === message.content &&
              m.role === message.role),
        )

        if (matchingMessages.length > 0) {
          // Replace the matching messages
          return updatedMessages.map(m => {
            if (matchingMessages.some(match => match.id === m.id)) {
              // Determine the correct status based ONLY on the incoming message's status
              // unless the stream just finished (handled above)
              const newStatus = streamJustFinished
                ? { type: 'complete', reason: 'stop' } // Already marked complete if stream finished
                : message.status // Otherwise, use the status from the incoming message part

              // console.log(
              //   'useEdenMessages.addOrUpdateMessage - replacing message',
              //   {
              //     oldId: m.id,
              //     newId: message.id,
              //     oldStatus: m.status,
              //     newStatus: newStatus,
              //     content: message.content,
              //   },
              // )

              return {
                ...m, // Start with existing message data
                ...message, // Overwrite with new message data
                // Preserve existing tool_calls if the new message doesn't have any
                tool_calls: message.tool_calls || m.tool_calls,
                status: newStatus, // Apply the determined status
              }
            }
            return m
          })
        } else {
          // Add new message
          const isAssistant = message.role === 'assistant'
          // Determine status based on incoming message, unless stream just finished
          const calculatedStatus = streamJustFinished
            ? { type: 'complete' as const, reason: 'stop' as const }
            : message.status

          // Only assign status if it's an assistant message OR if calculatedStatus is defined
          // User messages should not have a status unless explicitly provided (which they shouldn't be)
          const finalStatus = isAssistant
            ? calculatedStatus ?? {
                type: 'complete' as const,
                reason: 'unknown' as const,
              }
            : undefined

          const messageToAdd = {
            ...message,
            // Only include status field if it's defined (i.e., for assistant messages)
            ...(finalStatus && { status: finalStatus }),
          }

          // console.log('useEdenMessages.addOrUpdateMessage - adding new', {
          //   messageId: message.id,
          //   isActive: finalStatus?.type === 'running', // Check optional type
          //   isAssistant,
          //   status: finalStatus, // Log the final status or undefined
          //   createdAt: messageToAdd.createdAt,
          // })

          return [...updatedMessages, messageToAdd]
        }
      })
    },
    [readyState], // Removed activeMessageIds dependency as it's read directly inside
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
