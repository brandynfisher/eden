import LoadingIndicator from '@/components/loading-indicator'
import {
  MessageEmitter,
  createAsyncIterableFromEmitter,
} from '@/features/chat/MessageEmitter'
import { getThread, sendMessage } from '@/features/chat/chat-api'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider, MessageStatus } from '@assistant-ui/react'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { v4 as uuidv4 } from 'uuid'

const TIMEOUT_DURATION_MS = 60 * 60 * 1000

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
      <LoadingIndicator className="w-12 h-12" />
    </div>
  )
}

type ThreadMessageWithStatus = ThreadMessage & {
  status?: { type: 'running' | 'complete'; reason?: 'stop' | 'error' }
}

export type Thread = {
  messages?: ThreadMessage[]
  active?: string[]
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
  const { message: websocketMessage } = useWebSocketMessage({
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
        // Clear all state first
        setIsStreamActive(false)
        setIsRunning(false)
        setMessages([])
        messageEmitterRef.current = new MessageEmitter()
        threadIdRef.current = undefined

        if (typeof window !== 'undefined')
          window.history.pushState(null, '', `/chat/${agentId}`)

        setIsLoadingThread(false)
        setIsReadOnly(false)
      },
      onSwitchToThread: async (newThreadId: string) => {
        console.log('EdenRuntimeProvider.onSwitchToThread - start', {
          newThreadId,
        })

        setIsLoadingThread(true)
        try {
          // Reset state before switching
          setIsStreamActive(false)
          setIsRunning(false)
          messageEmitterRef.current = new MessageEmitter()
          threadIdRef.current = newThreadId

          // Update URL
          if (typeof window !== 'undefined') {
            window.history.pushState(
              null,
              '',
              `/chat/${agentId}/${newThreadId}`,
            )
          }

          // Get fresh thread data
          const thread = await getThread(newThreadId)
          console.log('EdenRuntimeProvider.onSwitchToThread - got thread', {
            threadId: newThreadId,
            hasMessages: !!thread.messages,
            messageCount: thread.messages?.length ?? 0,
            active: thread.active,
            lastMessage: thread.messages?.[thread.messages.length - 1],
          })

          if (!thread?.messages) {
            return { messages: [], active: [] }
          }

          // Only set read-only state if auth is loaded
          if (!isAuthLoading) {
            const isThreadReadOnly =
              !user || thread.user._id.toString() !== user._id.toString()
            setIsReadOnly(isThreadReadOnly)
          }

          // Process messages to determine status
          const messages = thread.messages.map((msg, index) => {
            // Ensure createdAt is a Date
            const baseMessage = {
              ...msg,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            }

            if (msg.role !== 'assistant') return baseMessage

            // A message is part of an active chain if:
            // 1. It's the root assistant message (in active array)
            // 2. It's a subsequent assistant message after an active root, before the next user message
            const isPartOfActiveChain = thread.active?.some(activeRootId => {
              if (activeRootId === msg.id) return true

              const activeRootIndex = thread.messages.findIndex(
                m => m.id === activeRootId,
              )
              if (activeRootIndex === -1) return false

              const nextUserIndex = thread.messages.findIndex(
                (m, i) => i > activeRootIndex && m.role === 'user',
              )

              return (
                index > activeRootIndex &&
                (nextUserIndex === -1 || index < nextUserIndex)
              )
            })

            const hasPendingToolCalls = msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

            const status =
              hasPendingToolCalls || isPartOfActiveChain
                ? { type: 'running' as const }
                : { type: 'complete' as const, reason: 'stop' as const }

            return {
              ...baseMessage,
              status,
            } as ThreadMessageWithStatus
          })

          // Determine if stream should be active
          const hasRunning = messages.some(
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

          // Also consider messages in active array
          const shouldBeActive = hasRunning || (thread.active?.length ?? 0) > 0
          setIsStreamActive(shouldBeActive)

          console.log('EdenRuntimeProvider.onSwitchToThread - returning', {
            threadId: newThreadId,
            messageCount: messages.length,
            hasRunning,
            active: thread.active,
            shouldBeActive,
          })

          return {
            messages: messages as ThreadMessageWithStatus[],
            active: thread.active ?? [],
          }
        } catch (error) {
          console.error('Error switching thread:', error)
          window.history.replaceState(null, '', `/chat/${agentId}`)
          return { messages: [], active: [] }
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
          const currentThreadId = threadIdRef.current

          try {
            const sendMessageResponse = await sendMessage({
              threadId: currentThreadId,
              agentId,
              // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
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
            if (!currentThreadId) {
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
              // If thread has changed, stop processing messages
              if (currentThreadId !== threadIdRef.current) {
                break
              }

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
            // Only yield error if it's not a cancellation and we're still on the same thread
            if (
              currentThreadId === threadIdRef.current &&
              (!error ||
                typeof error !== 'object' ||
                (error as { name?: string }).name !== 'CanceledError')
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

        // Process the thread data
        // console.log('Read-only check:', {
        //   threadUserId: thread.user._id,
        //   currentUserId: user?._id,
        //   threadUser: thread.user,
        //   currentUser: user,
        //   isAuthLoading
        // })

        // Only set read-only state if auth is loaded
        if (!isAuthLoading) {
          const isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }

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

        // Only update these states if they've actually changed
        if (isStreamActive !== shouldBeActive) {
          setIsStreamActive(shouldBeActive)
          setIsRunning(shouldBeActive)
        }

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

          // @ts-expect-error: Type mismatch between EdenMessage and ThreadMessageWithStatus needs to be resolved
          setMessages(processedMessages, thread.active)
        }

        return thread
      } catch (error) {
        console.error('Error checking thread status:', error)
      }
    },
    [setMessages, setIsRunning, user, isAuthLoading, isStreamActive],
  )

  // Modify the initial thread loading effect
  useEffect(() => {
    const loadThread = async () => {
      // Skip if no thread ID to load
      if (!threadId) {
        return
      }

      try {
        setIsLoadingThread(true)

        // Get the initial thread state
        const thread = await getThread(threadId)
        if (!thread) {
          console.error('Thread not found:', threadId)
          return
        }

        // Set thread ID first
        threadIdRef.current = threadId

        // Process the thread data
        if (!isAuthLoading) {
          const isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }

        const hasActiveRoots = thread.active && thread.active.length > 0
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

        const shouldBeActive = Boolean(
          hasActiveRoots || isLastMessageIncomplete,
        )

        if (thread.messages) {
          // Process messages to ensure proper active states
          const processedMessages = thread.messages.map((msg, index) => {
            if (msg.role !== 'assistant') return msg

            const hasPendingToolCalls = msg.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )

            const isPartOfActiveChain = thread.active?.some(activeRootId => {
              if (activeRootId === msg.id) return true

              const activeRootIndex = thread.messages.findIndex(
                m => m.id === activeRootId,
              )
              if (activeRootIndex === -1) return false

              const nextUserIndex = thread.messages.findIndex(
                (m, i) => i > activeRootIndex && m.role === 'user',
              )

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

          // @ts-expect-error: Type mismatch between EdenMessage and ThreadMessageWithStatus needs to be resolved
          setMessages(processedMessages, thread.active)
        }

        // Set stream active state after messages are processed
        setIsStreamActive(shouldBeActive)
        setIsRunning(shouldBeActive)
      } catch (error) {
        console.error('Error loading thread:', error)
      } finally {
        setIsLoadingThread(false)
      }
    }

    loadThread()
  }, [threadId, isAuthLoading, user, setMessages, setIsRunning])

  // Modify the websocket message effect to prevent unnecessary thread checks
  useEffect(() => {
    if (!websocketMessage || !threadIdRef.current) return

    const {
      thread_id,
      active: activeRootIds,
      newMessages,
    } = websocketMessage.data

    // Only process messages for the current thread
    if (thread_id !== threadIdRef.current || !newMessages?.length) {
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

      // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
      messageEmitterRef.current?.emit(newMsg)
      // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
      addOrUpdateMessage(newMsg, activeRootIds)
    })

    // Update stream state
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

    const newShouldBeActive = Boolean(
      hasAnyPendingToolCalls || hasIncompleteMessages || activeRootIds?.length,
    )

    if (isStreamActive !== newShouldBeActive) {
      setIsRunning(newShouldBeActive)
      setIsStreamActive(newShouldBeActive)
    }
  }, [websocketMessage, isStreamActive, setIsRunning, addOrUpdateMessage])

  // Simplify connection monitoring to only check current thread
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleConnectionChange = async () => {
      const isOnline = navigator.onLine
      const wasDisconnected = connectionStateRef.current.wasDisconnected

      if (!isOnline) {
        connectionStateRef.current.wasDisconnected = true
      } else if (wasDisconnected && threadIdRef.current) {
        // Only check thread status if we have a current thread and were previously disconnected
        await checkThreadStatus()
        connectionStateRef.current.wasDisconnected = false
      }
    }

    // Handle visibility change - only check status if we have a current thread
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
  }, [checkThreadStatus])

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
