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
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
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

  // Add request tracking
  const requestCounterRef = useRef(0)
  const lastSuccessfulRequestRef = useRef(0)
  const pendingThreadIdRef = useRef<string | undefined>(undefined)
  const isInitialLoadRef = useRef(true)
  const lastMessageTimestampRef = useRef<Record<string, Date>>({})

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
        // console.log('EdenRuntimeProvider.onSwitchToNewThread - resetting state')
        // Clear all state first
        setIsStreamActive(false)
        setIsRunning(false)
        setMessages([])
        messageEmitterRef.current = new MessageEmitter()
        threadIdRef.current = undefined
        pendingThreadIdRef.current = undefined
        // Don't clear lastMessageTimestampRef to preserve message history

        if (typeof window !== 'undefined')
          window.history.pushState(null, '', `/chat/${agentId}`)

        setIsLoadingThread(false)
        setIsReadOnly(false)
      },
      onSwitchToThread: async (newThreadId: string) => {
        // console.log('EdenRuntimeProvider.onSwitchToThread - start', {
        //   newThreadId,
        //   currentThreadId: threadIdRef.current,
        //   pendingThreadId: pendingThreadIdRef.current,
        //   lastMessageTimestamp: lastMessageTimestampRef.current[newThreadId],
        // })

        // If we're already switching to this thread, ignore
        if (pendingThreadIdRef.current === newThreadId) {
          // console.log(
          //   'EdenRuntimeProvider.onSwitchToThread - already switching to this thread, ignoring',
          // )
          return { messages: [], active: [] }
        }

        // Increment request counter
        const currentRequest = requestCounterRef.current + 1
        requestCounterRef.current = currentRequest

        setIsLoadingThread(true)
        try {
          // Track the pending thread ID and update URL before fetching
          pendingThreadIdRef.current = newThreadId

          // Update URL before fetching to ensure consistent state
          if (typeof window !== 'undefined') {
            window.history.pushState(
              null,
              '',
              `/chat/${agentId}/${newThreadId}`,
            )
          }

          // Get fresh thread data
          const thread = await getThread(newThreadId)

          // Only check for stale requests
          if (currentRequest < lastSuccessfulRequestRef.current) {
            // console.log(
            //   'EdenRuntimeProvider.onSwitchToThread - stale request, ignoring',
            //   {
            //     currentRequest,
            //     lastSuccessful: lastSuccessfulRequestRef.current,
            //     requestedThreadId: newThreadId,
            //   },
            // )
            return { messages: [], active: [] }
          }

          // Update thread ID after successful fetch
          threadIdRef.current = newThreadId

          // Check if the thread data is stale by comparing message timestamps
          const lastMessage = thread.messages?.[thread.messages.length - 1]
          const lastMessageDate = lastMessage?.createdAt
            ? new Date(lastMessage.createdAt)
            : null
          const lastKnownDate = lastMessageTimestampRef.current[newThreadId]

          // Only skip if we have both dates and the new data is definitely older
          if (
            lastKnownDate &&
            lastMessageDate &&
            lastMessageDate < lastKnownDate
          ) {
            // console.log(
            //   'EdenRuntimeProvider.onSwitchToThread - received stale thread data, ignoring',
            //   {
            //     threadId: newThreadId,
            //     lastMessageDate,
            //     lastKnownDate,
            //   },
            // )
            return { messages: [], active: [] }
          }

          // Update last message timestamp
          if (lastMessageDate) {
            lastMessageTimestampRef.current[newThreadId] = lastMessageDate
          }

          // Clear pending thread ID after successful fetch
          pendingThreadIdRef.current = undefined

          // Update last successful request
          lastSuccessfulRequestRef.current = currentRequest

          // console.log('EdenRuntimeProvider.onSwitchToThread - got thread', {
          //   threadId: newThreadId,
          //   hasMessages: !!thread.messages,
          //   messageCount: thread.messages?.length ?? 0,
          //   active: thread.active,
          //   lastMessage: thread.messages?.[thread.messages.length - 1],
          //   requestId: currentRequest,
          //   lastMessageDate,
          //   lastKnownDate,
          // })

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

            // Also check if message is incomplete
            const isIncomplete = !msg.content || msg.content.length === 0

            const status =
              hasPendingToolCalls || isPartOfActiveChain || isIncomplete
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
                ) ||
                !msg.content ||
                msg.content.length === 0),
          )

          // Also consider messages in active array
          const shouldBeActive = hasRunning || (thread.active?.length ?? 0) > 0

          // Only update stream state if it's changed
          if (isStreamActive !== shouldBeActive) {
            setIsStreamActive(shouldBeActive)
          }

          // console.log('EdenRuntimeProvider.onSwitchToThread - returning', {
          //   threadId: newThreadId,
          //   messageCount: messages.length,
          //   hasRunning,
          //   active: thread.active,
          //   shouldBeActive,
          //   requestId: currentRequest,
          // })

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
          // Process messages to ensure proper active states and types
          const processedMessages: ThreadMessageWithStatus[] =
            thread.messages.map((msg, index) => {
              // Ensure createdAt is a valid Date, default if necessary
              const createdAtDate = msg.createdAt
                ? new Date(msg.createdAt)
                : new Date()

              // Base structure compatible with ThreadMessageWithStatus (status will be added for assistant)
              const baseMessage = {
                ...msg,
                createdAt: createdAtDate,
              }

              if (baseMessage.role !== 'assistant') {
                // Return user/system messages directly, conforming to base ThreadMessage shape
                // (which is compatible with ThreadMessageWithStatus where status is optional)
                return baseMessage as ThreadMessageWithStatus
              }

              // --- Assistant Message Processing ---
              const assistantMessage = baseMessage as AssistantMessage // Cast for easier access

              const hasPendingToolCalls = assistantMessage.tool_calls?.some(
                call =>
                  !call.status ||
                  call.status === 'running' ||
                  call.status === 'pending',
              )

              const isPartOfActiveChain = thread.active?.some(activeRootId => {
                if (activeRootId === assistantMessage.id) return true
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

              const isIncomplete =
                !assistantMessage.content ||
                assistantMessage.content.length === 0

              const newStatus =
                hasPendingToolCalls || isPartOfActiveChain || isIncomplete
                  ? { type: 'running' as const }
                  : { type: 'complete' as const, reason: 'stop' as const }

              // Return assistant message with status
              return {
                ...assistantMessage,
                createdAt: createdAtDate, // Ensure correct date is carried over
                status: newStatus,
              } satisfies ThreadMessageWithStatus // Use satisfies for the final object
            })

          // Call setMessages with only the processed message array
          setMessages(processedMessages)
        } else {
          // Handle case where thread was empty (and no pending message was added)
          setMessages([]) // Pass only the empty array
        }

        // Set stream active state after messages are processed
        setIsStreamActive(shouldBeActive)
        setIsRunning(shouldBeActive)
      } catch (error) {
        console.error('Error checking thread status:', error)
      }
    },
    [setMessages, setIsRunning, user, isAuthLoading, isStreamActive],
  )

  // Modify the initial thread loading effect
  useEffect(() => {
    const loadThread = async () => {
      // Skip if we're not in initial load anymore
      if (!isInitialLoadRef.current) {
        return
      }

      if (!threadId || isAuthLoading || !user) return

      setIsLoadingThread(true)

      try {
        const thread = await getThread(threadId)
        if (!thread) {
          throw new Error('Thread not found')
        }

        // --- START: Add localStorage check here ---
        // @ts-expect-error // createdAt mismatch between SDK ThreadMessage and internal usage
        let currentMessages: ThreadMessage[] = thread.messages || [] // Use fetched messages or empty array
        const pendingMessageKey = `pending-message-${threadId}`
        const pendingMessageData = localStorage.getItem(pendingMessageKey)

        if (pendingMessageData) {
          try {
            const messageData = JSON.parse(pendingMessageData)
            const messageTimestamp = new Date(messageData.timestamp)
            // Only use messages that are less than 5 minutes old
            if (Date.now() - messageTimestamp.getTime() < 5 * 60 * 1000) {
              // Check if this message exists in currentMessages
              const messageExists = currentMessages.some(
                m =>
                  m.id === messageData.message_id ||
                  (m.id.startsWith('temp-') &&
                    messageData.message_id.startsWith('temp-') &&
                    m.content === messageData.content),
              )

              if (!messageExists) {
                console.log(
                  'EdenRuntimeProvider: Adding pending message from localStorage',
                  {
                    messageId: messageData.message_id,
                    content: messageData.content,
                  },
                )
                // Add the pending message
                const pendingMessage: ThreadMessage = {
                  id: messageData.message_id || `temp-${messageData.timestamp}`,
                  role: 'user',
                  content: messageData.content,
                  attachments: messageData.attachments || [],
                  createdAt: messageTimestamp,
                  // Add default/undefined for other potential ThreadMessage fields if needed
                }

                // Insert the pending message at the correct position based on timestamp
                const insertIndex = currentMessages.findIndex(
                  m => new Date(m.createdAt) > messageTimestamp,
                )

                if (insertIndex === -1) {
                  currentMessages.push(pendingMessage)
                } else {
                  currentMessages.splice(insertIndex, 0, pendingMessage)
                }
              }
            }
            // Clean up the pending message regardless of whether it was added (it might be old or already exist)
            localStorage.removeItem(pendingMessageKey)
          } catch (e) {
            console.error(
              'EdenRuntimeProvider: Error processing pending message:',
              e,
            )
            localStorage.removeItem(pendingMessageKey) // Clean up on error too
          }
        }
        // --- END: Add localStorage check here ---

        // Check if we need to clean up URL parameters
        const isPending = searchParams.get('pending') === 'true'
        const pendingMessageId = searchParams.get('message_id')

        if (isPending && pendingMessageId) {
          // Check if the pending message exists in the *potentially updated* currentMessages
          const messageExistsAfterUpdate = currentMessages.some(
            msg => msg.id === pendingMessageId,
          )
          if (messageExistsAfterUpdate) {
            const url = `/chat/${agentId}/${threadId}`
            window.history.replaceState({}, '', url)
          }
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
        // Use potentially updated currentMessages array
        const lastMessage = currentMessages[currentMessages.length - 1]
        const isLastMessageIncomplete =
          lastMessage?.role === 'assistant' &&
          // @ts-expect-error status might not exist
          (!lastMessage.status ||
            // @ts-expect-error status might not exist
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

        // Use potentially updated currentMessages array
        if (currentMessages.length > 0) {
          // Process messages to ensure proper active states and types
          // Ensure the output is strictly ThreadMessageWithStatus[] with required createdAt
          const processedMessages: ThreadMessageWithStatus[] =
            currentMessages.map((msg, index) => {
              // Ensure createdAt is a valid Date, default if necessary
              const createdAtDate = msg.createdAt
                ? new Date(msg.createdAt)
                : new Date() // Default to now if undefined

              // Base structure for user/system message
              let processedMsg: ThreadMessageWithStatus = {
                ...msg,
                createdAt: createdAtDate,
              }

              // Process assistant messages specifically
              if (processedMsg.role === 'assistant') {
                const assistantMessage = processedMsg as AssistantMessage & {
                  createdAt: Date
                } // Assert createdAt exists here

                const hasPendingToolCalls = assistantMessage.tool_calls?.some(
                  call =>
                    !call.status ||
                    call.status === 'running' ||
                    call.status === 'pending',
                )

                const isPartOfActiveChain = thread.active?.some(
                  activeRootId => {
                    if (activeRootId === assistantMessage.id) return true
                    const activeRootIndex = currentMessages.findIndex(
                      m => m.id === activeRootId,
                    )
                    if (activeRootIndex === -1) return false
                    const nextUserIndex = currentMessages.findIndex(
                      (m, i) => i > activeRootIndex && m.role === 'user',
                    )
                    return (
                      index > activeRootIndex &&
                      (nextUserIndex === -1 || index < nextUserIndex)
                    )
                  },
                )

                const isIncomplete =
                  !assistantMessage.content ||
                  assistantMessage.content.length === 0

                const newStatus =
                  hasPendingToolCalls || isPartOfActiveChain || isIncomplete
                    ? { type: 'running' as const }
                    : { type: 'complete' as const, reason: 'stop' as const }

                // Update the message object with status
                processedMsg = {
                  ...assistantMessage, // Spread the assistant message again
                  createdAt: createdAtDate, // Ensure date is still correct
                  status: newStatus,
                }
              }
              // Return the processed message (either user/system or assistant with status)
              return processedMsg
            })

          // Call setMessages with the processed message array
          setMessages(processedMessages)
        } else {
          // Handle case where thread was empty (and no pending message was added)
          setMessages([]) // Pass only the empty array
        }

        // Set stream active state after messages are processed
        setIsStreamActive(shouldBeActive)
        setIsRunning(shouldBeActive)
      } catch (error) {
        console.error('Error loading thread:', error)
        // Potentially redirect or show error if thread fetch fails
        // Example: window.history.replaceState(null, '', '/chat');
      } finally {
        setIsLoadingThread(false)
        isInitialLoadRef.current = false // Mark initial load as complete
      }
    }

    loadThread()
  }, [
    threadId,
    isAuthLoading,
    user,
    setMessages,
    setIsRunning,
    searchParams,
    agentId,
  ])

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
