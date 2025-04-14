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
      // console.log(
      //   '[useEdenMessages] Adding or updating message',
      //   activeIds,
      //   message,
      // )
      const streamJustFinished =
        activeIds !== undefined && activeIds.length === 0

      // If adding a user message, only set isRunning (isSending set before stream call)
      // REMOVED: This logic is flawed. User message adding should NOT set isRunning.
      // isRunning should reflect assistant activity.
      // if (message.role === 'user') {
      //  console.log(
      //    '[useEdenMessages] User message added, setting isRunning = true',
      //  )
      //  setIsRunning(true)
      // }

      // If stream just finished, set sending intention false
      // if (streamJustFinished) {
      // console.log(
      //   '[useEdenMessages] Stream finished, setting isSending = false',
      // )
      // setIsSending(false)
      // }

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

      return true
    },
    [processBatchUpdates, setIsRunning],
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
