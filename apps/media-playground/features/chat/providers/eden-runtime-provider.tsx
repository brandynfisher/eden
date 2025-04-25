import { EdenMessage } from '../eden-message-converter'
import LoadingIndicator from '@/components/loading-indicator'
import { getThread, sendMessage } from '@/features/chat/chat-api'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { useAuthState } from '@/hooks/use-auth-state'
import { ReadyState } from '@/hooks/use-shared-websocket-worker'
import { useWebSocketMessage } from '@/hooks/use-websocket-message'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const CHAT_INIT_STORAGE_KEY = 'chat-init-data'

type UIMessageStatus = {
  type: 'complete' | 'running'
  reason?: string
}

type ThreadMessageWithStatus = Omit<ThreadMessage, 'status'> & {
  status?: UIMessageStatus
}

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
      <LoadingIndicator className="w-12 h-12" />
    </div>
  )
}

// Helper to convert eden-sdk status to UI status
const convertToUIStatus = (
  status: AssistantMessage['status'],
): UIMessageStatus | undefined => {
  if (!status) return undefined

  if (status.type === 'complete' || status.type === 'running') {
    return {
      type: status.type,
      reason: status.reason,
    }
  }

  // For all other status types, mark as complete
  return {
    type: 'complete',
    reason: status.reason,
  }
}

export type Thread = {
  messages?: ThreadMessage[]
  active?: string[]
}

/** @deprecated Use my-runtime-provider instead */
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

  const threadIdRef = useRef<string | undefined>(threadId)
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

  // Ref to track the last processed websocket update signature
  const lastProcessedWebsocketUpdateSignature = useRef<string | null>(null)

  // Re-add abortCurrentStream
  const abortCurrentStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(
        new Error('Stream aborted by new operation'),
      )
      abortControllerRef.current = null
      // setIsStreamActive(false) // Let the websocket effect handle this based on active roots
    }
  }, [])

  // Modify stream function to properly handle thread IDs
  const streamFn = useCallback(
    async (
      messages: ThreadMessageWithStatus[],
      callback?: (thread_id?: string) => Promise<void>,
    ): Promise<AsyncGenerator<{ data: ThreadMessageWithStatus }>> => {
      return (async function* (): AsyncGenerator<{
        data: ThreadMessageWithStatus
      }> {
        let initialThreadId: string | undefined

        try {
          console.log('[EdenRuntimeProvider.stream] Starting stream:', {
            initialThreadId: threadIdRef.current,
            messageCount: messages.length,
            timestamp: new Date().toISOString(),
          })

          setIsStreamActive(true)
          initialThreadId = threadIdRef.current

          // Send the message to get thread_id first - WITHOUT abort signal
          const sendMessageResponse = await sendMessage({
            threadId: initialThreadId,
            agentId,
            messages: messages.map(msg => ({
              ...msg,
              status:
                msg.status?.type === 'running' ||
                msg.status?.type === 'complete'
                  ? msg.status
                  : { type: 'running' as const },
            })) as unknown as EdenMessage[],
            abortSignal: undefined,
          })

          // Abort previous stream *before* sending the new message
          abortCurrentStream?.()

          // Check response and thread_id type
          if (
            sendMessageResponse.status !== 200 ||
            typeof sendMessageResponse.data?.thread_id !== 'string'
          ) {
            console.error(
              '[EdenRuntimeProvider.stream] sendMessage API call failed or invalid thread_id',
              {
                status: sendMessageResponse.status,
                data: sendMessageResponse.data,
                currentThreadId: initialThreadId,
              },
            )
            const errorMessage: ThreadMessageWithStatus = {
              id: uuidv4(),
              role: 'assistant',
              content: JSON.stringify(
                sendMessageResponse?.data?.message ||
                  'API Error or Invalid Thread ID',
              ),
              status: { type: 'complete' as const, reason: 'stop' },
              createdAt: new Date(),
            }
            yield { data: errorMessage }
            setIsStreamActive(false)
            return
          }

          const newThreadId = sendMessageResponse.data.thread_id

          // Update thread ref and callback if needed
          if (!initialThreadId) {
            initialThreadId = newThreadId
            threadIdRef.current = newThreadId
            callback && (await callback(newThreadId))

            console.log(
              '[EdenRuntimeProvider.stream] sendMessage successful:',
              {
                newThreadId,
                timestamp: new Date().toISOString(),
              },
            )
          } else {
            console.log(
              '[EdenRuntimeProvider.stream] sendMessage successful (existing thread):',
              {
                threadId: initialThreadId,
                timestamp: new Date().toISOString(),
              },
            )
          }

          // End of stream function - no more yielding here.
          // Updates will come via the websocket useEffect.
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'name' in error &&
            (error.name === 'CanceledError' || error.name === 'AbortError')
          ) {
            console.log('[EdenRuntimeProvider.stream] Stream aborted:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString(),
            })
            setIsStreamActive(false)
            return
          }

          if (
            initialThreadId === threadIdRef.current &&
            (!error || (error instanceof Error && error.name !== 'AbortError'))
          ) {
            console.error(
              `[EdenRuntimeProvider stream ${
                initialThreadId || 'NEW'
              }] Stream error:`,
              error,
            )
            yield {
              data: {
                id: uuidv4(),
                role: 'assistant',
                status: { type: 'complete' as const, reason: 'error' },
                content: `Error: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
                createdAt: new Date(),
              } as ThreadMessageWithStatus,
            }
          }
          throw error
        } finally {
          // Do not set isStreamActive to false here.
          // It will be set by the websocket useEffect based on activeRootIds.
          console.log(
            '[EdenRuntimeProvider.stream] Finished stream function execution.',
            {
              initialThreadId: initialThreadId,
              timestamp: new Date().toISOString(),
            },
          )
        }
      })()
    },
    [agentId, abortCurrentStream],
  )

  // Now use the stream function in useEdenRuntime
  const { runtime, setMessages, addOrUpdateMessage } = useEdenRuntime({
    agentId,
    isReadOnly: !isAuthLoading ? isReadOnly : null,
    threadId: threadIdRef.current,
    abortCurrentStream,
    stream: streamFn,
    onSwitchToNewThread: async () => {
      setIsStreamActive(false)
      setMessages([])
      threadIdRef.current = undefined
      pendingThreadIdRef.current = undefined

      if (typeof window !== 'undefined')
        window.history.pushState(null, '', `/chat/${agentId}`)

      setIsLoadingThread(false)
      setIsReadOnly(false)
    },
    onSwitchToThread: async (newThreadId: string) => {
      // console.log('[EdenRuntimeProvider] Attempting to switch to thread:', {
      //   newThreadId,
      //   currentThreadId: threadIdRef.current,
      //   pendingThreadId: pendingThreadIdRef.current,
      // })

      if (pendingThreadIdRef.current === newThreadId) {
        // console.log('[EdenRuntimeProvider] Already switching to this thread, ignoring')
        return { messages: [], active: [], shouldBeActive: false }
      }

      const currentRequest = requestCounterRef.current + 1
      requestCounterRef.current = currentRequest
      setIsLoadingThread(true)
      pendingThreadIdRef.current = newThreadId // Track pending request

      try {
        // Update URL immediately when switching to an EXISTING thread
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/chat/${agentId}/${newThreadId}`)
        }

        const thread = await getThread(newThreadId)

        // Stale request check
        if (currentRequest < lastSuccessfulRequestRef.current) {
          // console.log('[EdenRuntimeProvider] Stale thread switch request detected')
          return { messages: [], active: [], shouldBeActive: false }
        }

        // --- Success ---
        threadIdRef.current = newThreadId // Update ref only on success
        lastSuccessfulRequestRef.current = currentRequest
        pendingThreadIdRef.current = undefined // Clear pending request

        if (!thread?.messages) {
          setMessages([]) // Clear messages if thread is empty
          setIsReadOnly(false) // Assume new thread is writable
          return { messages: [], active: [], shouldBeActive: false }
        }

        // Read-only check
        let isThreadReadOnly = false
        if (!isAuthLoading) {
          isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }

        // --- Refactored Message Processing ---
        setMessages([]) // Clear existing messages first

        let hasRunningMessages = false

        // Process messages individually via addOrUpdateMessage
        thread.messages.forEach((msg, index) => {
          const createdAtDate = msg.createdAt
            ? new Date(msg.createdAt)
            : new Date()
          const baseMessage = { ...msg, createdAt: createdAtDate }

          if (baseMessage.role !== 'assistant') {
            addOrUpdateMessage(baseMessage as ThreadMessageWithStatus)
            return
          }

          // Status calculation logic (consistent with checkThreadStatus)
          const assistantMessage = baseMessage as AssistantMessage
          const hasPendingToolCalls = assistantMessage.tool_calls?.some(
            call =>
              !call.status ||
              call.status === 'running' ||
              call.status === 'pending',
          )
          const isPartOfActiveChain = thread.active?.some(activeRootId => {
            if (activeRootId === assistantMessage.id) return true
            const activeRootIndex = thread.messages!.findIndex(
              m => m.id === activeRootId,
            )
            if (activeRootIndex === -1) return false
            const nextUserIndex = thread.messages!.findIndex(
              (m, i) => i > activeRootIndex && m.role === 'user',
            )
            return (
              index > activeRootIndex &&
              (nextUserIndex === -1 || index < nextUserIndex)
            )
          })
          const isIncomplete =
            !assistantMessage.content || assistantMessage.content.length === 0

          const newStatus =
            hasPendingToolCalls || isPartOfActiveChain || isIncomplete
              ? ({
                  type: 'running' as const,
                } satisfies AssistantMessage['status'])
              : ({
                  type: 'complete' as const,
                  reason: 'stop' as const,
                } satisfies AssistantMessage['status'])

          if (newStatus.type === 'running') {
            hasRunningMessages = true
          }

          const messageToAdd = {
            ...assistantMessage,
            createdAt: createdAtDate,
            status: newStatus,
          } satisfies ThreadMessageWithStatus

          addOrUpdateMessage(messageToAdd)
        })

        // Determine initial shouldBeActive state
        const shouldBeActive =
          hasRunningMessages || (thread.active?.length ?? 0) > 0
        setIsStreamActive(shouldBeActive) // Set initial stream state here

        // Return the initial state after clearing
        return {
          messages: [], // Messages will be populated via addOrUpdateMessage
          active: thread.active ?? [],
          shouldBeActive,
        }
      } catch (error) {
        console.error('Error switching thread:', error)
        // Revert URL if fetch fails
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/chat/${agentId}`)
        }
        threadIdRef.current = undefined // Reset threadId if switch failed
        setMessages([]) // Clear messages on error
        setIsReadOnly(false) // Reset read-only state
        return { messages: [], active: [], shouldBeActive: false }
      } finally {
        setIsLoadingThread(false)
        if (pendingThreadIdRef.current === newThreadId) {
          pendingThreadIdRef.current = undefined // Clear pending if it matches failed request
        }
      }
    },
  })

  // Modify the websocket message effect to properly process messages
  // Stabilize dependencies by stringifying relevant data
  const websocketMessageDataString = JSON.stringify({
    thread_id: websocketMessage?.data?.thread_id,
    newMessages: websocketMessage?.data?.newMessages?.map(m => m.id),
    active: websocketMessage?.data?.active,
  })

  useEffect(() => {
    // Use the original websocketMessage object inside the effect
    if (!websocketMessage?.data || !threadIdRef.current) return

    const {
      thread_id,
      active: activeRootIds,
      newMessages,
      // Assuming msgId exists on the websocket payload, or use another unique identifier
      msgId,
    } = websocketMessage.data

    // Create a signature for the current update
    const currentUpdateSignature = JSON.stringify({
      msgId, // Include msgId or another unique event identifier
      thread_id,
      messageIds: newMessages?.map(m => m.id).sort(),
      activeRootIds,
    })

    // Skip if this exact update signature has already been processed
    if (
      currentUpdateSignature === lastProcessedWebsocketUpdateSignature.current
    ) {
      // console.log('[EdenRuntimeProvider] Skipping processing duplicate websocket update')
      return
    } else {
      // Add log to see when we *do* process an update
      console.log(
        '[EdenRuntimeProvider] New websocket update signature detected:',
        {
          prev: lastProcessedWebsocketUpdateSignature.current,
          curr: currentUpdateSignature,
          timestamp: new Date().toISOString(),
        },
      )
    }

    // Only process messages for the current thread
    if (thread_id !== threadIdRef.current) {
      console.log(
        '[EdenRuntimeProvider] Ignoring message for different thread:',
        {
          receivedThreadId: thread_id,
          currentThreadId: threadIdRef.current,
        },
      )
      return
    }

    // If no new messages, skip update
    if (!newMessages?.length) {
      // console.log('[EdenRuntimeProvider] No new messages to process in this update')
      return
    }

    console.log('[EdenRuntimeProvider] Processing websocket messages:', {
      // Use newMessages directly
      messageCount: newMessages.length,
      threadId: thread_id,
      hasActiveRoots: Boolean(activeRootIds?.length),
      timestamp: new Date().toISOString(),
    })

    // Process ALL received messages
    newMessages.forEach(msg => {
      // Removed unused @ts-expect-error
      const processedMsg = {
        ...msg,
        status: convertToUIStatus(msg.status),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      } as ThreadMessageWithStatus

      console.log('[EdenRuntimeProvider] Processing websocket message:', {
        id: processedMsg.id,
        content: processedMsg.content?.slice(0, 50),
        status: processedMsg.status,
        timestamp: new Date().toISOString(),
      })

      addOrUpdateMessage(processedMsg)
    })

    // Update the ref *after* successful processing
    lastProcessedWebsocketUpdateSignature.current = currentUpdateSignature

    // Update stream state based on active roots
    if (!activeRootIds?.length && isStreamActive) {
      console.log('[EdenRuntimeProvider] No more active roots, ending stream')
      setIsStreamActive(false)
      abortControllerRef.current?.abort(
        new Error('WebSocket indicated completion'),
      )
    }

    // Depend on the stable stringified data + other necessary dependencies
  }, [
    websocketMessageDataString,
    isStreamActive,
    addOrUpdateMessage,
    threadIdRef.current,
  ])

  // Now we need to potentially update the runtime with the actual stream function?
  // This seems like the original @assistant-ui pattern might be necessary,
  // where the runtime object itself holds the stream reference.
  // For now, let's assume the hook structure can handle this.

  const checkThreadStatus = useCallback(
    async (shouldSetMessages = true) => {
      if (!threadIdRef.current) return

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
        }

        if (shouldSetMessages && thread.messages) {
          // Clear existing messages before re-adding to ensure consistency
          setMessages([])

          // Process messages individually via addOrUpdateMessage
          thread.messages.forEach((msg, index) => {
            const createdAtDate = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date()
            const baseMessage = { ...msg, createdAt: createdAtDate }

            if (baseMessage.role !== 'assistant') {
              addOrUpdateMessage(baseMessage as ThreadMessageWithStatus)
              return
            }

            // Logic to determine status (copied from original map)
            const assistantMessage = baseMessage as AssistantMessage
            const hasPendingToolCalls = assistantMessage.tool_calls?.some(
              call =>
                !call.status ||
                call.status === 'running' ||
                call.status === 'pending',
            )
            const isPartOfActiveChain = thread.active?.some(activeRootId => {
              if (activeRootId === assistantMessage.id) return true
              const activeRootIndex = thread.messages!.findIndex(
                m => m.id === activeRootId,
              )
              if (activeRootIndex === -1) return false
              const nextUserIndex = thread.messages!.findIndex(
                (m, i) => i > activeRootIndex && m.role === 'user',
              )
              return (
                index > activeRootIndex &&
                (nextUserIndex === -1 || index < nextUserIndex)
              )
            })
            const isIncomplete =
              !assistantMessage.content || assistantMessage.content.length === 0

            const newStatus =
              hasPendingToolCalls || isPartOfActiveChain || isIncomplete
                ? ({
                    type: 'running' as const,
                  } satisfies AssistantMessage['status'])
                : ({
                    type: 'complete' as const,
                    reason: 'stop' as const,
                  } satisfies AssistantMessage['status'])

            const messageToAdd = {
              ...assistantMessage,
              createdAt: createdAtDate,
              status: newStatus,
            } satisfies ThreadMessageWithStatus

            // Add each message via the hook's function
            addOrUpdateMessage(messageToAdd)
          })
        } else {
          // Handle case where thread was empty (and no pending message was added)
          setMessages([]) // Pass only the empty array
        }

        // Set stream active state after messages are processed
        setIsStreamActive(shouldBeActive)
      } catch (error) {
        console.error('Error checking thread status:', error)
      }
    },
    [
      setMessages,
      addOrUpdateMessage,
      user,
      isAuthLoading,
      isStreamActive,
      isReadOnly,
    ],
  )

  // --- Load Existing Thread useEffect (Simplified) ---
  useEffect(() => {
    // Only run if a threadId is provided via props and client is mounted
    if (!threadId || !isClientMounted) {
      // console.log('[EdenRuntimeProvider] Waiting for client mount:', {
      //   threadId,
      //   isClientMounted,
      //   isInitialLoad: isInitialLoadRef.current,
      //   currentThreadId: threadIdRef.current,
      // })
      return
    }

    // Prevent duplicate loads
    if (threadIdRef.current === threadId && !isInitialLoadRef.current) {
      // console.log('[EdenRuntimeProvider] Skipping duplicate thread load:', {
      //   threadId,
      //   currentThreadId: threadIdRef.current,
      // })
      return
    }

    // console.log('[EdenRuntimeProvider] Loading thread:', {
    //   threadId,
    //   currentThreadId: threadIdRef.current,
    //   isInitialLoad: isInitialLoadRef.current,
    // })

    // Set loading state and load thread data
    (async () => {
      setIsLoadingThread(true)
      try {
        const thread = await getThread(threadId)
        console.log('[EdenRuntimeProvider] Thread data loaded:', {
          threadId,
          hasMessages: !!thread?.messages?.length,
          messageCount: thread?.messages?.length,
        })

        if (!thread?.messages) {
          setMessages([])
          return
        }

        // Process messages to ensure proper active states and types
        const processedMessages: ThreadMessageWithStatus[] =
          thread.messages.map((msg, index) => {
            const createdAtDate = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date()
            const baseMessage = { ...msg, createdAt: createdAtDate }

            if (baseMessage.role !== 'assistant') {
              return baseMessage as ThreadMessageWithStatus
            }

            const assistantMessage = baseMessage as AssistantMessage
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
              !assistantMessage.content || assistantMessage.content.length === 0

            const newStatus =
              hasPendingToolCalls || isPartOfActiveChain || isIncomplete
                ? { type: 'running' as const }
                : { type: 'complete' as const, reason: 'stop' as const }

            return {
              ...assistantMessage,
              createdAt: createdAtDate,
              status: newStatus,
            } satisfies ThreadMessageWithStatus
          })

        threadIdRef.current = threadId
        setMessages(processedMessages)
        // console.log('[EdenRuntimeProvider] Thread messages processed and set:', {
        //   threadId,
        //   messageCount: processedMessages.length,
        //   currentThreadId: threadIdRef.current,
        // })

        // Set read-only state
        if (!isAuthLoading) {
          const isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }

        // Mark initial load as complete
        isInitialLoadRef.current = false
      } catch (error) {
        console.error('Error loading thread:', error)
        toast.error('Failed to load thread')
        setMessages([])
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/chat/${agentId}`)
        }
        threadIdRef.current = undefined
      } finally {
        setIsLoadingThread(false)
      }
    })()
  }, [threadId, isClientMounted, agentId, user, isAuthLoading])

  // --- NEW: Initial Chat Start useEffect (No Thread ID) ---
  useEffect(() => {
    // Only run on client, when authenticated, have a valid agentId prop,
    // and if there's no initial threadId provided via props
    if (
      !isClientMounted ||
      isAuthLoading ||
      !user ||
      !agentId || // Ensure agentId prop is valid
      threadId // Check the initial prop value directly
    ) {
      // console.log('[EdenRuntimeProvider] Skipping initial chat start:', {
      //   isClientMounted,
      //   isAuthLoading,
      //   hasUser: !!user,
      //   agentId,
      //   threadId,
      //   currentThreadId: threadIdRef.current,
      // })
      return
    }

    // Use a flag to ensure this runs only once per component lifecycle when conditions are met
    if (isInitialLoadRef.current === false) {
      // console.log('[EdenRuntimeProvider] Initial load already handled')
      return
    }

    const initChatDataString = localStorage.getItem(CHAT_INIT_STORAGE_KEY)
    // console.log('[EdenRuntimeProvider] Initial chat data:', {
    // hasInitData: !!initChatDataString,
    // currentThreadId: threadIdRef.current,
    // })

    if (!initChatDataString) {
      // No initial data found, normal state (e.g., navigated directly to /chat/agent)
      isInitialLoadRef.current = false
      setIsLoadingThread(false) // Ensure loading is cleared
      return
    }

    // Mark as processing initial load immediately
    isInitialLoadRef.current = false

    console.log('[EdenRuntimeProvider] Processing initial chat data:', {
      initChatDataString,
      isInitialLoadRef: isInitialLoadRef.current,
      isLoadingThread: isLoadingThread,
      isClientMounted: isClientMounted,
      isAuthLoading: isAuthLoading,
      user: user,
      agentId: agentId,
    })

    try {
      const initChatData = JSON.parse(initChatDataString)

      // Basic validation
      if (
        !initChatData.content ||
        typeof initChatData.content !== 'string' ||
        initChatData.agentUsername !== agentId
      ) {
        console.error(
          '[EdenRuntimeProvider] Invalid initial chat data found (agentId mismatch?).',
          initChatData,
          agentId,
        )
        setIsLoadingThread(false)
        return
      }

      // Validation succeeded, NOW remove the item
      localStorage.removeItem(CHAT_INIT_STORAGE_KEY)

      // Construct the initial user message
      const initialUserMessage: ThreadMessageWithStatus = {
        id: uuidv4(),
        role: 'user' as const,
        content: initChatData.content,
        attachments: initChatData.attachments || [],
        createdAt: new Date(initChatData.timestamp || Date.now()),
        metadata: {
          custom: null,
        },
        status: undefined,
      }

      // Create a placeholder assistant message
      const placeholderAssistantMessage: ThreadMessageWithStatus = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: '',
        createdAt: new Date(),
        metadata: {
          custom: null,
        },
        status: { type: 'running' },
      }

      setMessages([initialUserMessage, placeholderAssistantMessage])

      // Then trigger the stream to actually send the message
      ;(async () => {
        try {
          const messageGenerator = await streamFn(
            [initialUserMessage],
            async newThreadId => {
              if (newThreadId) {
                threadIdRef.current = newThreadId
                // Update URL history after receiving the ID
                if (typeof window !== 'undefined') {
                  window.history.replaceState(
                    null,
                    '',
                    `/chat/${initChatData.agentUsername}/${newThreadId}`,
                  )
                }
                setIsReadOnly(false)
              }
            },
          )

          // Process the stream
          for await (const message of messageGenerator) {
            console.log(
              '[EdenRuntimeProvider] Stream message received:',
              message,
            )
          }
        } catch (error) {
          console.error(
            '[EdenRuntimeProvider] Error in initial message stream:',
            error,
          )
          toast.error('Failed to send initial message')
          setMessages([])
          if (typeof window !== 'undefined') {
            window.history.replaceState(
              null,
              '',
              `/chat/${initChatData.agentUsername}`,
            )
          }
        }
      })()
    } catch (e) {
      console.error('[EdenRuntimeProvider] Error parsing initial chat data:', e)
      toast.error('Failed to read initial chat data.')
      setIsLoadingThread(false)
    }
  }, [isClientMounted, isAuthLoading, user, setMessages, threadId, agentId])

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
      if (
        document.visibilityState === 'visible' &&
        threadIdRef.current &&
        isStreamActive // Only check if we have an active stream
      ) {
        checkThreadStatus(false) // Don't force message updates unless necessary
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
  }, [checkThreadStatus, isStreamActive])

  // Initialize client-side only refs after mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize abort controller
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController()
    }

    // Set client mounted state and trigger thread load if needed
    setIsClientMounted(true)

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(new Error('Component unmounting'))
        abortControllerRef.current = null
      }
      setIsClientMounted(false)
      isInitialLoadRef.current = true
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
