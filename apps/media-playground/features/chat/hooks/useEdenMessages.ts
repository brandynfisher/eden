import { ReadyState } from '@/hooks/use-shared-websocket-worker'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'

type MessageResponse<T> = {
  data: T & {
    active?: string[]
  }
}

// Revert to SDK compatible definition: content is optional string
export type ThreadMessageWithStatus = Omit<ThreadMessage, 'status'> & {
  status?: AssistantMessage['status']
}

export const useEdenMessages = <TMessage extends ThreadMessageWithStatus>({
  stream,
  setIsRunning,
}: // setIsSending,
{
  stream: (
    messages: TMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<MessageResponse<TMessage>>>
  setIsRunning: (isRunning: boolean) => void
  // setIsSending: (isSending: boolean) => void
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])
  const { readyState } = useWebSocketContext()
  const lastConnectionStateRef = useRef<ReadyState>(readyState)
  const pendingOptimisticMessagesRef = useRef<TMessage[]>([])
  const batchUpdatesRef = useRef<TMessage[]>([])
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Batch process message updates
  const processBatchUpdates = useCallback(() => {
    if (batchUpdatesRef.current.length === 0) return

    const updates = [...batchUpdatesRef.current]
    batchUpdatesRef.current = []

    setMessages(currentMessages => {
      const updatedMessages = [...currentMessages]
      const processedIds = new Set<string>()
      let placeholderIndex = -1
      let firstAssistantUpdateProcessed = false

      // Find placeholder before processing updates
      placeholderIndex = updatedMessages.findIndex(
        m => m.role === 'assistant' && !m.content, // Check for assistant role and empty content
      )

      updates.forEach(message => {
        // --- Placeholder Replacement Logic ---
        if (
          message.role === 'assistant' &&
          placeholderIndex !== -1 && // Placeholder exists
          !firstAssistantUpdateProcessed // Haven't replaced placeholder in this batch yet
        ) {
          // Replace the placeholder with the first incoming assistant message
          // Use all data from the incoming message, including its real ID
          updatedMessages[placeholderIndex] = { ...message }
          processedIds.add(message.id) // Mark this ID as processed
          firstAssistantUpdateProcessed = true // Mark placeholder as replaced for this batch
          // No need to reset placeholderIndex, as we only replace once
        }
        // --- Standard Update/Add Logic ---
        else {
          const existingIndex = updatedMessages.findIndex(
            m => m.id === message.id,
          )

          if (existingIndex !== -1) {
            // Update existing message (if it wasn't the placeholder we just replaced)
            if (
              existingIndex !== placeholderIndex ||
              !firstAssistantUpdateProcessed
            ) {
              const existingMessage = updatedMessages[existingIndex]
              updatedMessages[existingIndex] = {
                ...existingMessage,
                ...message, // Overwrite with new data
              }
              processedIds.add(message.id) // Mark as processed
            }
          } else if (!processedIds.has(message.id)) {
            // Add message only if it wasn't processed via placeholder replacement or standard update
            updatedMessages.push(message)
            processedIds.add(message.id)
          }
        }
      })

      // Always return the potentially updated array. React will diff it.
      return updatedMessages
    })
  }, [])

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      const messageToAdd = message // Use the message directly

      // Signal stream completion if activeIds is empty
      const streamJustFinished =
        activeIds !== undefined && activeIds.length === 0
      if (streamJustFinished) {
        setIsRunning(false)
        // Clear pending optimistic messages upon stream completion
        pendingOptimisticMessagesRef.current = []
        // Force update status of all currently running messages to complete
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'stop' } }
              : m,
          ),
        )
      }

      // Add to batch updates (still needed to process the final message content/tool_calls)
      batchUpdatesRef.current.push(messageToAdd)

      // Clear any existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }

      // Process batch after a short delay
      batchTimeoutRef.current = setTimeout(() => {
        processBatchUpdates()
      }, 50) // 50ms batch window

      // Track optimistic messages (only if stream hasn't just finished)
      // We still add assistant messages before they are complete
      if (message.role === 'assistant' && !streamJustFinished) {
        pendingOptimisticMessagesRef.current.push(messageToAdd)
      }

      return true
    },
    // Add setIsRunning to dependencies
    [processBatchUpdates, setIsRunning, setMessages],
  )

  // Handle connection state changes
  useEffect(() => {
    if (readyState !== lastConnectionStateRef.current) {
      lastConnectionStateRef.current = readyState

      if (
        readyState === ReadyState.CLOSED ||
        readyState === ReadyState.CLOSING
      ) {
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'error' } }
              : m,
          ),
        )
      } else if (
        readyState === ReadyState.OPEN &&
        pendingOptimisticMessagesRef.current.length > 0
      ) {
        // Reapply optimistic updates in batches
        const chunks = pendingOptimisticMessagesRef.current.reduce<
          TMessage[][]
        >((acc, msg, i) => {
          const chunkIndex = Math.floor(i / 5)
          if (!acc[chunkIndex]) acc[chunkIndex] = []
          acc[chunkIndex].push(msg)
          return acc
        }, [])

        chunks.forEach((chunk, i) => {
          setTimeout(() => {
            chunk.forEach(msg => addOrUpdateMessage(msg))
          }, i * 50) // Stagger chunks by 50ms
        })
      }
    }
  }, [readyState, addOrUpdateMessage, setIsRunning])

  const sendMessage = useCallback(
    async (
      newMessages: TMessage[],
      callback?: (thread_id?: string) => Promise<void>,
    ): Promise<AsyncGenerator<MessageResponse<TMessage>>> => {
      pendingOptimisticMessagesRef.current = []

      // Optimistic message add happens here BEFORE stream starts
      // This is where we need setIsRunning(true)
      setTimeout(() => {
        newMessages.forEach(message => {
          if (message.role === 'user') {
            // console.log(
            //   '[useEdenMessages sendMessage] Adding user message, setting isRunning = true',
            // )
            setIsRunning(true)
          }
          const messageWithStatus = {
            ...message,
            status:
              message.role === 'assistant' ? { type: 'running' } : undefined,
          }
          // console.log(
          //   'sendMessage adding message with status',
          //   message,
          //   messageWithStatus,
          //   pendingOptimisticMessagesRef.current,
          // )
          addOrUpdateMessage(messageWithStatus as TMessage)
        })
      }, 0)

      // RETURN the stream generator directly
      return stream(newMessages, callback)
    },
    [addOrUpdateMessage, stream, setIsRunning],
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [])

  return {
    messages,
    sendMessage,
    setMessages,
    addOrUpdateMessage,
  }
}
