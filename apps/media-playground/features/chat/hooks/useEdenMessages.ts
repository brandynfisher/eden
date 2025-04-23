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
    batchUpdatesRef.current = [] // Clear batch immediately to prevent duplicate processing

    setMessages(currentMessages => {
      const updatedMessages = [...currentMessages]
      const processedIds = new Set() // Track processed messages to prevent duplicates

      // Process updates in order
      updates.forEach(message => {
        if (processedIds.has(message.id)) return // Skip if already processed
        processedIds.add(message.id)

        const existingIndex = updatedMessages.findIndex(
          m => m.id === message.id,
        )

        if (existingIndex !== -1) {
          updatedMessages[existingIndex] = {
            ...updatedMessages[existingIndex],
            ...message,
          }
        } else {
          updatedMessages.push(message)
        }
      })

      return updatedMessages
    })
  }, [])

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      // Clear any existing timeout first
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
        batchTimeoutRef.current = undefined
      }

      // Add message to batch
      batchUpdatesRef.current.push(message)

      // Process immediately if stream is complete
      if (activeIds !== undefined && activeIds.length === 0) {
        processBatchUpdates()

        const existingMessageIndex = messages.findIndex(
          m => m.id === message.id,
        )
        const isNewAssistantMessage =
          message.role === 'assistant' && existingMessageIndex === -1

        if (
          message.content &&
          message.content.length > 0 &&
          isNewAssistantMessage
        ) {
          setIsRunning(false)
        }
      } else {
        // Otherwise batch with a short delay
        batchTimeoutRef.current = setTimeout(() => {
          processBatchUpdates()
          batchTimeoutRef.current = undefined
        }, 50)
      }

      return true
    },
    [processBatchUpdates, setIsRunning, messages],
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
      setIsRunning(true)

      // Clear any pending state
      pendingOptimisticMessagesRef.current = []
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
        batchTimeoutRef.current = undefined
      }
      batchUpdatesRef.current = []

      // Add user messages first
      for (const message of newMessages) {
        if (message.role === 'user') {
          addOrUpdateMessage(message)
        }
      }

      // Start stream and process messages
      const stream_generator = await stream(newMessages, callback)

      // Create a wrapper generator that processes messages as they come in
      return (async function* () {
        try {
          for await (const message of stream_generator) {
            console.log('[useEdenMessages] Received stream message:', {
              id: message.data.id,
              content: message.data.content?.slice(0, 50),
              status: message.data.status,
              active: message.data.active,
            })

            // Process the message
            addOrUpdateMessage(message.data, message.data.active)

            // Yield the message for other consumers
            yield message
          }
        } catch (error) {
          console.error('[useEdenMessages] Stream error:', error)
          throw error
        }
      })()
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
