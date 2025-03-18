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

          const threadFetch = await checkThreadStatus(false)
          return {
            messages: (threadFetch?.messages as EdenMessage[]) ?? [],
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
      onRename: async (threadId, newTitle) => {
        console.log('rename', threadId, newTitle)
      },
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
      console.log('checkThreadStatus', {
        threadId: threadIdRef.current,
        isAuthLoading,
      })
      if (!threadIdRef.current || !messageEmitterRef.current) return

      // If auth is still loading, delay the check
      if (isAuthLoading) return

      try {
        const thread = await getThread(threadIdRef.current)
        if (!thread) return

        const isThreadReadOnly =
          !user || thread.user._id.toString() !== user?._id.toString()
        setIsReadOnly(isThreadReadOnly)

        // Check if thread has active messages
        const hasActiveMessages = thread.active && thread.active.length > 0
        setIsStreamActive(hasActiveMessages ?? false)
        setIsRunning(hasActiveMessages ?? false)

        if (shouldSetMessages && thread.messages) {
          setMessages(thread.messages as EdenMessage[])
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
      console.log('Auth state changed, rechecking thread status')
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

    window.addEventListener('online', handleConnectionChange)
    window.addEventListener('offline', handleConnectionChange)

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      connectionStateRef.current.wasDisconnected = true
    }

    return () => {
      window.removeEventListener('online', handleConnectionChange)
      window.removeEventListener('offline', handleConnectionChange)
    }
  }, [readyState, checkThreadStatus])

  useEffect(() => {
    if (!websocketMessage || (!isStreamActive && !threadIdRef.current)) return

    const {
      thread_id,
      active: activeMessageIds,
      newMessages,
    } = websocketMessage.data

    if (!newMessages?.length) return

    // Verify message belongs to current thread
    if (threadIdRef.current && thread_id && threadIdRef.current !== thread_id) {
      console.log('Message not for current thread, ignoring!')
      return
    }

    // Process new messages
    newMessages.forEach(msg => {
      const newMsg = {
        ...msg,
        status: activeMessageIds?.length ? { type: 'running' } : msg.status,
      }

      //@ts-expect-error status is not typed
      messageEmitterRef.current?.emit(newMsg)
      //@ts-expect-error status is not typed
      addOrUpdateMessage(newMsg)
    })

    // Check if stream should be ended
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage.status?.type === 'complete' && !activeMessageIds?.length) {
      setIsRunning(false)
      setIsStreamActive(false)
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
