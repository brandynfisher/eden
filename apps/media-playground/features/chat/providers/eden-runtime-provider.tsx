import LoadingIndicator from '@/components/loading-indicator'
import {
  MessageEmitter,
  createAsyncIterableFromEmitter,
} from '@/features/chat/MessageEmitter'
import { getThread, sendMessage } from '@/features/chat/chat-api'
import { EdenMessage } from '@/features/chat/eden-message-converter'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider, MessageStatus } from '@assistant-ui/react'
import { AssistantMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 60 * 60 * 1000

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
      <LoadingIndicator className="w-12 h-12" />
    </div>
  )
}

export function EdenRuntimeProvider({
  agentId,
  threadId,
  children,
}: Readonly<{
  agentId: string
  threadId?: string
  children: ReactNode
}>) {
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)

  const threadIdRef = useRef<string | undefined>(undefined)
  const messageEmitterRef = useRef<MessageEmitter | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { user, isLoading: isAuthLoading } = useAuthState()
  const [isReadOnly, setIsReadOnly] = useState(false)
  const { message: websocketMessage, readyState } = useWebSocketMessage({
    eventType: 'thread-update',
    abortSignal: abortControllerRef.current?.signal,
  })

  const [isStreamActive, setIsStreamActive] = useState(false)
  const connectionStateRef = useRef({
    wasDisconnected: false,
    lastKnownState: ReadyState.UNINSTANTIATED,
  })

  // Create a new abort controller for a new stream
  const getStreamAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    return abortControllerRef.current
  }, [])

  const { runtime, setIsRunning, setMessages, addOrUpdateMessage } =
    useEdenRuntime({
      agentId,
      isReadOnly: !isAuthLoading ? isReadOnly : null,
      threadId: threadIdRef.current,
      onSwitchToNewThread: async () => {
        setIsStreamActive(false)
        setIsRunning(false)
        setIsLoadingThread(true)

        // Create new abort controller for the new thread
        getStreamAbortController()
        threadIdRef.current = undefined

        if (typeof window !== 'undefined')
          window.history.pushState(null, '', `/chat/${agentId}`)

        setIsLoadingThread(false)
        setIsReadOnly(false)
      },
      onSwitchToThread: async newThreadId => {
        setIsLoadingThread(true)
        try {
          threadIdRef.current = newThreadId

          if (typeof window !== 'undefined')
            window.history.pushState(
              null,
              '',
              `/chat/${agentId}/${newThreadId}`,
            )

          const thread = await getThread(newThreadId)
          if (!thread?.messages) {
            return { messages: [] }
          }

          // Process messages to ensure proper active states
          const processedMessages = thread.messages.map((msg, index) => {
            if (msg.role !== 'assistant') return msg

            const hasPendingToolCalls = msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

            // A message is part of an active chain if:
            // 1. It's the root assistant message (in active array)
            // 2. It's a subsequent assistant message after an active root, before the next user message
            const isPartOfActiveChain = thread.active?.some(activeRootId => {
              if (activeRootId === msg.id) return true // This is the root message

              // Find this message's position in the chain
              const activeRootIndex = thread.messages.findIndex(
                m => m.id === activeRootId,
              )
              if (activeRootIndex === -1) return false

              // Find the next user message after the active root
              const nextUserIndex = thread.messages.findIndex(
                (m, i) => i > activeRootIndex && m.role === 'user',
              )

              // This message is part of the chain if it's between the root and the next user message
              return (
                index > activeRootIndex &&
                (nextUserIndex === -1 || index < nextUserIndex)
              )
            })

            const newStatus =
              hasPendingToolCalls || isPartOfActiveChain
                ? { type: 'running' as const }
                : { type: 'complete' as const, reason: 'stop' as const }

            return {
              ...msg,
              status: newStatus,
            }
          })

          // Set stream active if we have active messages
          const hasActiveRoots = thread.active && thread.active.length > 0
          const lastMessage = thread.messages[thread.messages.length - 1]
          const isLastMessageIncomplete =
            lastMessage?.role === 'assistant' &&
            (!lastMessage.status ||
              lastMessage.status.type === 'running' ||
              lastMessage.tool_calls?.some(
                call =>
                  !call.status ||
                  call.status === 'running' ||
                  call.status === 'pending',
              ))

          const shouldBeActive = Boolean(
            hasActiveRoots || isLastMessageIncomplete,
          )
          setIsStreamActive(shouldBeActive)
          setIsRunning(shouldBeActive)

          return {
            messages: processedMessages as EdenMessage[],
          }
        } catch (error) {
          console.error('Error switching thread:', error)
          toast.error('Failed to switch to thread', {
            description: `Thread may not exist or you may not have access to it`,
            dismissible: true,
            richColors: true,
          })
          window.history.replaceState(null, '', `/chat/${agentId}`)
          return { messages: [] }
        } finally {
          setIsLoadingThread(false)
        }
      },
      // onRename: async () => {
      //   // console.log('rename', threadId, newTitle)
      // },
      //@ts-expect-error message status is not typed
      stream: async (messages, callback) => {
        return (async function* () {
          if (!messageEmitterRef.current) {
            messageEmitterRef.current = new MessageEmitter()
          }

          const messageEmitter = messageEmitterRef.current
          const streamAbortController = getStreamAbortController()

          try {
            const sendMessageResponse = await sendMessage({
              threadId: threadIdRef.current,
              agentId,
              messages,
              abortSignal: streamAbortController.signal,
            })

            if (
              sendMessageResponse.status !== 200 ||
              !sendMessageResponse.data.thread_id
            ) {
              yield {
                data: {
                  id: uuidv4(),
                  role: 'assistant',
                  content: JSON.stringify(sendMessageResponse?.data?.message),
                  status: { type: 'incomplete', reason: 'error' },
                },
              }
              return
            }

            // If new thread
            if (!threadIdRef.current) {
              threadIdRef.current = sendMessageResponse.data.thread_id as string
              callback &&
                (await callback(sendMessageResponse.data.thread_id as string))
            }

            // Now create our async-iterator with the AbortSignal
            const messageIterable = createAsyncIterableFromEmitter(
              messageEmitter,
              {
                timeout: TIMEOUT_DURATION_MS,
                signal: streamAbortController.signal,
              },
            )

            for await (const message of messageIterable) {
              const assistantMessage = message as AssistantMessage

              yield {
                data: {
                  id: assistantMessage.id,
                  role: 'assistant',
                  status: assistantMessage.status as MessageStatus,
                  content: assistantMessage.content,
                  tool_calls: assistantMessage.tool_calls,
                },
              }
            }
          } catch (error) {
            // Only yield error if it's not a cancellation
            if (
              !error ||
              typeof error !== 'object' ||
              (error as { name?: string }).name !== 'CanceledError'
            ) {
              yield {
                data: {
                  id: uuidv4(),
                  role: 'assistant',
                  status: { type: 'incomplete', reason: 'error' },
                  content: `Error: ${(error as { message: string }).message}`,
                },
              }
            }
            throw error // Re-throw to properly handle cancellation
          }
        })()
      },
    })

  const checkThreadStatus = useCallback(
    async (shouldSetMessages = true) => {
      if (!threadIdRef.current || !messageEmitterRef.current) return

      // If auth is still loading, delay the check
      if (isAuthLoading) return

      try {
        const thread = await getThread(threadIdRef.current)
        if (!thread) return

        const isThreadReadOnly =
          !user || thread.user._id.toString() !== user?._id.toString()
        setIsReadOnly(isThreadReadOnly)

        // Check if thread has active messages and evaluate their states
        const hasActiveRoots = thread.active && thread.active.length > 0

        // Check if the last message is incomplete/running
        const lastMessage = thread.messages?.[thread.messages.length - 1]
        const isLastMessageIncomplete =
          lastMessage?.role === 'assistant' &&
          (!lastMessage.status ||
            lastMessage.status.type === 'running' ||
            lastMessage.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            ))

        // Set stream active if we have active root messages or the last message is incomplete
        const shouldBeActive = Boolean(
          hasActiveRoots || isLastMessageIncomplete,
        )
        setIsStreamActive(shouldBeActive)
        setIsRunning(shouldBeActive)

        if (shouldSetMessages && thread.messages) {
          // Process messages to ensure proper active states
          const processedMessages = thread.messages.map((msg, index) => {
            if (msg.role !== 'assistant') return msg

            const hasPendingToolCalls = msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

            // A message is part of an active chain if:
            // 1. It's the root assistant message (in active array)
            // 2. It's a subsequent assistant message after an active root, before the next user message
            const isPartOfActiveChain = thread.active?.some(activeRootId => {
              if (activeRootId === msg.id) return true // This is the root message

              // Find this message's position in the chain
              const activeRootIndex = thread.messages.findIndex(
                m => m.id === activeRootId,
              )
              if (activeRootIndex === -1) return false

              // Find the next user message after the active root
              const nextUserIndex = thread.messages.findIndex(
                (m, i) => i > activeRootIndex && m.role === 'user',
              )

              // This message is part of the chain if it's between the root and the next user message
              const messageIndex = index
              return (
                messageIndex > activeRootIndex &&
                (nextUserIndex === -1 || messageIndex < nextUserIndex)
              )
            })

            const newStatus =
              hasPendingToolCalls || isPartOfActiveChain
                ? { type: 'running' as const }
                : { type: 'complete' as const, reason: 'stop' as const }

            return {
              ...msg,
              status: newStatus,
            }
          })

          // @ts-expect-error Types between MessageStatus and MessageWithStatus need alignment
          setMessages(processedMessages, thread.active)
        }

        return thread
      } catch (error) {
        console.error('Error checking thread status:', error)
      }
    },
    [setMessages, setIsRunning, user, isAuthLoading],
  )

  // Add an effect to recheck thread status when auth state changes
  useEffect(() => {
    if (!isAuthLoading && threadIdRef.current) {
      // console.log('Auth state changed, rechecking thread status')
      checkThreadStatus()
    }
  }, [isAuthLoading, user, checkThreadStatus])

  // Modify the initial thread loading effect
  useEffect(() => {
    const loadThread = async () => {
      if (!threadId && !threadIdRef.current) {
        return
      }

      // Only proceed if thread ID has changed
      if (threadId === threadIdRef.current) return

      try {
        setIsLoadingThread(true)
        threadIdRef.current = threadId

        if (threadIdRef.current) {
          runtime.threads.switchToThread(threadIdRef.current)
          // Only check thread status if auth is loaded
          if (!isAuthLoading) {
            await checkThreadStatus()
          }
        }
      } catch (error) {
        console.error('Error loading thread:', error)
      } finally {
        setIsLoadingThread(false)
      }
    }

    loadThread()
  }, [threadId, runtime, checkThreadStatus, isAuthLoading])

  // Connection monitoring effect with reduced re-renders
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleConnectionChange = async () => {
      const isOnline = navigator.onLine
      const wasDisconnected = connectionStateRef.current.wasDisconnected

      if (!isOnline) {
        connectionStateRef.current.wasDisconnected = true
      } else if (wasDisconnected) {
        // Only trigger a re-fetch if we were previously disconnected
        await checkThreadStatus()
        connectionStateRef.current.wasDisconnected = false
      }
    }

    // Check WebSocket state changes without triggering re-renders
    if (readyState !== connectionStateRef.current.lastKnownState) {
      connectionStateRef.current.lastKnownState = readyState
      if (
        readyState === ReadyState.CLOSED ||
        readyState === ReadyState.CLOSING
      ) {
        connectionStateRef.current.wasDisconnected = true
      } else if (
        connectionStateRef.current.wasDisconnected &&
        readyState === ReadyState.OPEN
      ) {
        checkThreadStatus()
        connectionStateRef.current.wasDisconnected = false
      }
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && threadIdRef.current) {
        checkThreadStatus()
      }
    }

    window.addEventListener('online', handleConnectionChange)
    window.addEventListener('offline', handleConnectionChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      connectionStateRef.current.wasDisconnected = true
    }

    return () => {
      window.removeEventListener('online', handleConnectionChange)
      window.removeEventListener('offline', handleConnectionChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [readyState, checkThreadStatus])

  useEffect(() => {
    if (!websocketMessage || (!isStreamActive && !threadIdRef.current)) return

    const {
      thread_id,
      active: activeRootIds,
      newMessages,
    } = websocketMessage.data

    if (!newMessages?.length) return

    // Verify message belongs to current thread
    if (threadIdRef.current && thread_id && threadIdRef.current !== thread_id) {
      return
    }

    // Process new messages
    newMessages.forEach(msg => {
      const hasPendingToolCalls = (
        msg as { tool_calls?: Array<{ status?: string }> }
      ).tool_calls?.some(
        call =>
          !call.status ||
          call.status === 'running' ||
          call.status === 'pending',
      )

      // A message is part of an active chain if:
      // 1. It's the root assistant message (in active array)
      // 2. It's a subsequent assistant message in the current update batch
      const isPartOfActiveChain =
        activeRootIds?.some(rootId => rootId === msg.id) ||
        (msg.role === 'assistant' && activeRootIds && activeRootIds.length > 0)

      const isMessageRunning = !msg.status || msg.status.type === 'running'

      const newMsg = {
        ...msg,
        status:
          hasPendingToolCalls || isPartOfActiveChain || isMessageRunning
            ? { type: 'running' }
            : msg.status,
      }

      //@ts-expect-error status is not typed
      messageEmitterRef.current?.emit(newMsg)
      //@ts-expect-error status is not typed
      addOrUpdateMessage(newMsg, activeRootIds)
    })

    // Check if stream should be ended
    const hasAnyPendingToolCalls = newMessages.some(msg =>
      (msg as { tool_calls?: Array<{ status?: string }> }).tool_calls?.some(
        call =>
          !call.status ||
          call.status === 'running' ||
          call.status === 'pending',
      ),
    )
    const hasIncompleteMessages = newMessages.some(
      msg => !msg.status || msg.status.type === 'running',
    )

    if (
      !hasAnyPendingToolCalls &&
      !hasIncompleteMessages &&
      !activeRootIds?.length
    ) {
      setIsRunning(false)
      setIsStreamActive(false)
    } else {
      setIsRunning(true)
      setIsStreamActive(true)
    }
  }, [websocketMessage, isStreamActive, setIsRunning, addOrUpdateMessage])

  // Initialize client-side only refs after mount
  useEffect(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController()
    }
    if (!messageEmitterRef.current) {
      messageEmitterRef.current = new MessageEmitter()
    }
    setIsClientMounted(true)

    return () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Only render loading overlay after client mount
  const showLoadingOverlay = isClientMounted && isLoadingThread

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {showLoadingOverlay && <LoadingOverlay />}
      {children}
    </AssistantRuntimeProvider>
  )
}
