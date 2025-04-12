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

      updates.forEach(message => {
        const existingIndex = updatedMessages.findIndex(
          m => m.id === message.id,
        )

        if (existingIndex !== -1) {
          updatedMessages[existingIndex] = {
            ...updatedMessages[existingIndex],
            ...message,
            tool_calls:
              message.tool_calls || updatedMessages[existingIndex].tool_calls,
          }
        } else if (!processedIds.has(message.id)) {
          updatedMessages.push(message)
          processedIds.add(message.id)
        }
      })

      return updatedMessages
    })
  }, [])

  const addOrUpdateMessage = useCallback(
    (message: TMessage, activeIds?: string[]) => {
      const streamJustFinished =
        activeIds !== undefined && activeIds.length === 0

      const messageToAdd = {
        ...message,
        status: streamJustFinished
          ? { type: 'complete' as const, reason: 'stop' as const }
          : message.status ||
            (message.role === 'assistant'
              ? { type: 'running' as const }
              : message.status),
      }

      // Add to batch updates
      batchUpdatesRef.current.push(messageToAdd)

      // Clear any existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }

      // Process batch after a short delay
      batchTimeoutRef.current = setTimeout(() => {
        processBatchUpdates()
      }, 50) // 50ms batch window

      // Track optimistic messages
      if (message.role === 'assistant' && !streamJustFinished) {
        pendingOptimisticMessagesRef.current.push(messageToAdd)
      }

      // Clear pending messages if stream finished
      if (streamJustFinished) {
        pendingOptimisticMessagesRef.current = []
      }
    },
    [processBatchUpdates],
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
  }, [readyState, addOrUpdateMessage])

  const sendMessage = useCallback(
    async (
      newMessages: TMessage[],
      callback?: (thread_id?: string) => Promise<void>,
    ) => {
      pendingOptimisticMessagesRef.current = []

      // Add optimistic updates in next tick to avoid blocking
      setTimeout(() => {
        newMessages.forEach(message => {
          const messageWithStatus = {
            ...message,
            status:
              message.role === 'assistant' ? { type: 'running' } : undefined,
          }
          console.log(
            'sendMessage adding message with status',
            message,
            messageWithStatus,
            pendingOptimisticMessagesRef.current,
          )
          addOrUpdateMessage(messageWithStatus as TMessage)
        })
      }, 0)

      try {
        const response = await stream(newMessages, callback)
        for await (const message of response) {
          addOrUpdateMessage(message.data, message.data.active)
        }
      } catch (error) {
        console.error('Error in message stream:', error)
        setMessages(currentMessages =>
          currentMessages.map(m =>
            m.status?.type === 'running'
              ? { ...m, status: { type: 'complete', reason: 'error' } }
              : m,
          ),
        )
        pendingOptimisticMessagesRef.current = []
      }
    },
    [addOrUpdateMessage],
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
