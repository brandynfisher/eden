import LoadingIndicator from '@/components/loading-indicator'
import {
  MessageEmitter,
  createAsyncIterableFromEmitter,
} from '@/features/chat/MessageEmitter'
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

const TIMEOUT_DURATION_MS = 60 * 60 * 1000
const CHAT_INIT_STORAGE_KEY = 'chat-init-data'

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
      <LoadingIndicator className="w-12 h-12" />
    </div>
  )
}

// Define UIMessageStatus locally
type UIMessageStatus =
  | { readonly type: 'running' }
  | { readonly type: 'complete'; readonly reason: 'stop' | 'unknown' }

// Define ThreadMessageWithStatus locally using imported base types
export type ThreadMessageWithStatus = Omit<ThreadMessage, 'status'> & {
  status?: UIMessageStatus
  // Ensure tool_calls structure matches if needed, e.g.:
  // tool_calls?: (Omit<ToolCall, 'status'> & { status?: string })[];
}

// Helper to convert eden-sdk status to UI status
function convertToUIStatus(
  status?: AssistantMessage['status'],
): UIMessageStatus | undefined {
  if (!status) return undefined

  if (status.type === 'running') {
    return { type: 'running' }
  }

  return {
    type: 'complete',
    reason: status.reason === 'stop' ? 'stop' : 'unknown',
  }
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

  const threadIdRef = useRef<string | undefined>(threadId)
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

  // Define controllers FIRST
  const getStreamAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      console.log(
        '[EdenRuntimeProvider] Aborting previous stream controller (reason: new stream)',
      )
      abortControllerRef.current.abort(new Error('New stream starting'))
    }
    abortControllerRef.current = new AbortController()
    return abortControllerRef.current
  }, [])

  const abortCurrentStream = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('[EdenRuntimeProvider] Explicitly aborting current stream', {
        hasController: true,
        isAborted: abortControllerRef.current.signal.aborted,
        currentThreadId: threadIdRef.current,
      })
      abortControllerRef.current.abort()
      abortControllerRef.current = null // Clear the ref after aborting
    } else {
      console.log('[EdenRuntimeProvider] No stream controller to abort', {
        currentThreadId: threadIdRef.current,
      })
    }
  }, [])

  // Define stream function, depends on controllers and state setters
  const stream = useCallback(
    async (
      messages: ThreadMessageWithStatus[],
      callback?: (thread_id?: string) => Promise<void>,
    ) => {
      return (async function* () {
        const streamAbortController = getStreamAbortController()
        const currentThreadId = threadIdRef.current
        let hasReceivedAnyMessage = false
        let hasStartedMessageProcessing = false
        let messageHandlerSet = false

        // Ensure the shared emitter exists
        if (!messageEmitterRef.current) {
          messageEmitterRef.current = new MessageEmitter()
        }

        console.log('[EdenRuntimeProvider.stream] Starting new stream', {
          currentThreadId,
          messageCount: messages.length,
          hasAbortController: !!streamAbortController,
        })

        try {
          // Create the message iterator from the SHARED emitter
          const messageIterable = createAsyncIterableFromEmitter(
            messageEmitterRef.current,
            {
              timeout: TIMEOUT_DURATION_MS,
              signal: streamAbortController.signal,
            },
          )

          // Mark that we're starting message processing
          hasStartedMessageProcessing = true

          // Send the message to get thread_id first
          const sendMessageResponse = await sendMessage({
            threadId: currentThreadId,
            agentId,
            //@ts-expect-error message status type mismatch
            messages,
            abortSignal: streamAbortController.signal,
          })

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
                currentThreadId,
              },
            )
            const errorMessage: ThreadMessageWithStatus = {
              id: uuidv4(),
              role: 'assistant',
              content: JSON.stringify(
                sendMessageResponse?.data?.message ||
                  'API Error or Invalid Thread ID',
              ),
              status: { type: 'complete', reason: 'stop' },
              createdAt: new Date(),
            }
            yield { data: errorMessage }
            return
          }
          const newThreadId = sendMessageResponse.data.thread_id // Now we know it's a string

          // Update thread ref and callback if needed
          if (!currentThreadId) {
            threadIdRef.current = newThreadId
            callback && (await callback(newThreadId))
          }

          console.log(
            `[EdenRuntimeProvider stream ${threadIdRef.current}] Starting message iteration`,
            {
              hasReceivedAnyMessage,
              messageHandlerSet,
              hasStartedMessageProcessing,
            },
          )

          // Process messages as they come in
          try {
            for await (const message of messageIterable) {
              // Check for thread switch using the LATEST ref value inside the loop
              const latestThreadId = threadIdRef.current
              console.log(
                `[EdenRuntimeProvider stream ${latestThreadId}] Loop check: Comparing captured ID (${currentThreadId}) with latest ref ID (${latestThreadId})`,
              )
              if (currentThreadId !== latestThreadId) {
                console.log(
                  `[EdenRuntimeProvider stream ${latestThreadId}] Aborting iteration due to thread switch`,
                  {
                    capturedStreamId: currentThreadId,
                    latestThreadIdRef: latestThreadId,
                  },
                )
                break
              }

              const assistantMessage = message as AssistantMessage
              console.log(
                '[EdenRuntimeProvider.stream] Processing message from iterator:',
                {
                  messageId: assistantMessage.id,
                  hasContent: !!assistantMessage.content,
                  status: assistantMessage.status,
                  threadId: threadIdRef.current,
                },
              )

              // Set flags when first message arrives
              if (!hasReceivedAnyMessage) {
                hasReceivedAnyMessage = true
                messageHandlerSet = true // Or maybe remove this flag entirely?
              }

              // Convert message to UI format with explicit typing
              const uiMessage = {
                id: assistantMessage.id,
                role: 'assistant' as const,
                content: assistantMessage.content || '',
                status: convertToUIStatus(assistantMessage.status),
                metadata: assistantMessage.metadata,
                createdAt: assistantMessage.createdAt,
              }

              yield { data: uiMessage }

              // Removed internal completion check - termination is handled by abort signal
            }
          } catch (iterError) {
            // Handle specific error types if needed, e.g., AbortError
            if (iterError instanceof Error && iterError.name === 'AbortError') {
              console.log(
                `[EdenRuntimeProvider stream ${threadIdRef.current}] Stream aborted as expected.`,
              )
            } else {
              console.error(
                `[EdenRuntimeProvider stream ${threadIdRef.current}] Error in message iteration:`,
                iterError,
              )
            }
            // Don't re-throw AbortError, let finally handle cleanup
            if (
              !(iterError instanceof Error && iterError.name === 'AbortError')
            ) {
              throw iterError
            }
          } finally {
            // Check the isSending flag captured by the closure
          }

          console.log(
            `[EdenRuntimeProvider stream ${threadIdRef.current}] Finished message iteration outside try/catch`,
          )
        } catch (error: unknown) {
          if (
            currentThreadId === threadIdRef.current &&
            (!error || (error instanceof Error && error.name !== 'AbortError'))
          ) {
            console.error(
              `[EdenRuntimeProvider stream ${
                currentThreadId || 'NEW'
              }] Stream error:`,
              error,
            )
            yield {
              data: {
                id: uuidv4(),
                role: 'assistant',
                status: { type: 'complete', reason: 'error' },
                content: `Error: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
                createdAt: new Date(),
              },
            }
          }
          throw error
        }
      })()
    },
    [agentId, getStreamAbortController],
  ) // ADD isSending dependency

  // Destructure only the necessary values from useEdenRuntime
  const { runtime, setMessages, addOrUpdateMessage } = useEdenRuntime({
    agentId,
    isReadOnly: !isAuthLoading ? isReadOnly : null,
    threadId: threadIdRef.current,
    abortCurrentStream: abortCurrentStream,
    // @ts-expect-error stream type mismatch
    stream: stream,
    onSwitchToNewThread: async () => {
      // console.log('EdenRuntimeProvider.onSwitchToNewThread - resetting state')
      // Clear all state first
      setIsStreamActive(false)
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

      if (pendingThreadIdRef.current === newThreadId) {
        // console.log(
        //   'EdenRuntimeProvider.onSwitchToThread - already switching to this thread, ignoring',
        // )
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
          // console.log('EdenRuntimeProvider.onSwitchToThread - stale request ...')
          return { messages: [], active: [], shouldBeActive: false }
        }

        // --- Success ---
        threadIdRef.current = newThreadId // Update ref only on success
        lastSuccessfulRequestRef.current = currentRequest
        pendingThreadIdRef.current = undefined // Clear pending request

        if (!thread?.messages) {
          setMessages([]) // Clear messages if thread is empty
          return { messages: [], active: [], shouldBeActive: false }
        }

        // Read-only check
        if (!isAuthLoading) {
          const isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }

        // Process messages (keep existing logic for status calculation)
        const messages = thread.messages.map((msg, index) => {
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
              ? ({ type: 'running' as const } satisfies UIMessageStatus)
              : ({
                  type: 'complete' as const,
                  reason: 'stop' as const,
                } satisfies UIMessageStatus)

          return { ...baseMessage, status } as ThreadMessageWithStatus
        })

        // Determine if stream should be active (keep existing logic)
        const hasRunning = messages.some(
          msg => msg.role === 'assistant' && msg.status?.type === 'running',
        )
        const shouldBeActive = hasRunning || (thread.active?.length ?? 0) > 0

        // console.log('EdenRuntimeProvider.onSwitchToThread - returning ...')
        return {
          messages: messages as ThreadMessageWithStatus[],
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
        return { messages: [], active: [], shouldBeActive: false }
      } finally {
        setIsLoadingThread(false)
        if (pendingThreadIdRef.current === newThreadId) {
          pendingThreadIdRef.current = undefined // Clear pending if it matches failed request
        }
      }
    },
  })

  // Now we need to potentially update the runtime with the actual stream function?
  // This seems like the original @assistant-ui pattern might be necessary,
  // where the runtime object itself holds the stream reference.
  // For now, let's assume the hook structure can handle this.

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
        }

        if (shouldSetMessages && thread.messages) {
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
                !assistantMessage.content ||
                assistantMessage.content.length === 0

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

          // Call setMessages with only the processed message array
          setMessages(processedMessages)
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
    [setMessages, user, isAuthLoading, isStreamActive, isReadOnly],
  )

  // --- Load Existing Thread useEffect (Simplified) ---
  useEffect(() => {
    // Only run if a threadId is provided via props and initial load hasn't been handled by the effect above
    if (!threadId || !isClientMounted || !isInitialLoadRef.current) {
      return
    }

    // Prevent the other effect from running if we are loading an existing thread
    isInitialLoadRef.current = false

    // console.log(`[EdenRuntimeProvider] Loading existing thread: ${threadId}`);

    // Set loading state. The actual data loading is triggered internally
    // by the useEdenRuntime hook calling onSwitchToThread due to threadId change.
    ;(async () => {
      setIsLoadingThread(true)
      try {
        const thread = await getThread(threadId)
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

        // Set read-only state
        if (!isAuthLoading) {
          const isThreadReadOnly =
            !user || thread.user._id.toString() !== user._id.toString()
          setIsReadOnly(isThreadReadOnly)
        }
      } catch (error) {
        console.error('Error loading thread:', error)
        toast.error('Failed to load thread')
        setMessages([])
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/chat/${agentId}`)
        }
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
      return
    }

    // Use a flag to ensure this runs only once per component lifecycle when conditions are met
    if (isInitialLoadRef.current === false) {
      return
    }

    const initChatDataString = localStorage.getItem(CHAT_INIT_STORAGE_KEY)
    console.log('[EdenRuntimeProvider] initChatDataString', initChatDataString)
    if (!initChatDataString) {
      // No initial data found, normal state (e.g., navigated directly to /chat/agent)
      isInitialLoadRef.current = false
      setIsLoadingThread(false) // Ensure loading is cleared
      return
    }

    // Mark as processing initial load immediately
    isInitialLoadRef.current = false

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
          const messageGenerator = await stream(
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

  // Modify the websocket message effect to prevent unnecessary thread checks
  useEffect(() => {
    if (!websocketMessage || !threadIdRef.current) return

    const {
      thread_id,
      active: activeRootIds,
      newMessages,
    } = websocketMessage.data

    // Only process messages for the current thread
    if (thread_id !== threadIdRef.current) {
      return
    }

    // Add check here: If newMessages is null or undefined, we might still need to update active state, but cannot process messages.
    if (!newMessages) {
      // We still need to evaluate if the stream should stop based *only* on activeRootIds
      const newShouldBeActive = Boolean(activeRootIds?.length)
      if (!newShouldBeActive && isStreamActive) {
        console.log(
          '[EdenRuntimeProvider] Websocket indicates stream completion (no new messages, empty active array), aborting stream',
          {
            threadId: thread_id,
            activeRootIds,
            currentThreadId: threadIdRef.current,
          },
        )
        abortControllerRef.current?.abort(
          new Error('WebSocket indicated completion (no new messages)'),
        )
      }
      // Update the internal stream active flag based solely on activeRootIds
      setIsStreamActive(newShouldBeActive)
      return // Exit after handling active state based on activeRootIds only
    }

    // Process new messages (Now we know newMessages is not null/undefined)
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
            : { type: 'complete', reason: 'stop' },
      }

      // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
      messageEmitterRef.current?.emit(newMsg)

      // Update messages state to replace placeholder with actual message
      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages]
        // Find and remove any placeholder messages
        const placeholderIndex = updatedMessages.findIndex(
          m => m.role === 'assistant' && (!m.content || m.content.length === 0),
        )
        if (placeholderIndex !== -1) {
          updatedMessages.splice(placeholderIndex, 1)
        }
        // Add the new message
        // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
        updatedMessages.push(newMsg)
        return updatedMessages
      })
    })

    // Update stream state and abort if necessary (Now we know newMessages is not null/undefined)
    const hasAnyPendingToolCalls = newMessages.some(
      (
        msg, // Safe to access .some
      ) =>
        (msg as { tool_calls?: Array<{ status?: string }> }).tool_calls?.some(
          call =>
            !call.status ||
            call.status === 'running' ||
            call.status === 'pending',
        ),
    )
    const hasIncompleteMessages = newMessages.some(
      // Safe to access .some
      msg => !msg.status || msg.status.type === 'running',
    )

    const newShouldBeActive = Boolean(
      hasAnyPendingToolCalls || hasIncompleteMessages || activeRootIds?.length,
    )

    // If the stream should no longer be active, ONLY abort the controller
    // The generator's finally block will handle setting isRunning state
    if (!newShouldBeActive && isStreamActive) {
      // Check if it *was* active
      console.log(
        '[EdenRuntimeProvider] Websocket indicates stream completion, aborting stream',
        {
          threadId: thread_id,
          activeRootIds,
          currentThreadId: threadIdRef.current,
        },
      )
      abortControllerRef.current?.abort(
        new Error('WebSocket indicated completion'),
      )
    }

    // Always update the internal stream active flag
    setIsStreamActive(newShouldBeActive)
  }, [websocketMessage, isStreamActive, addOrUpdateMessage])

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
