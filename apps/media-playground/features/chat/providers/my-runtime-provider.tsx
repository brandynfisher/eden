'use client'

import { getThread, sendMessage } from '../chat-api'
import edenFeedbackAdapter from '../eden-feedback-adapter'
import edenImageAttachmentAdapter from '../eden-image-attachment-adapter'
import { EdenMessage, convertEdenMessage } from '../eden-message-converter'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketContext } from '@/providers/websocket-provider'
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  ThreadMessageLike,
  useThread,
} from '@assistant-ui/react'
import {
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const symbolEdenExtras = Symbol('eden-extras')

export type EdenExtras = {
  [symbolEdenExtras]: true
  agentId: string
  threadId: string
  isReadOnly?: boolean
}

interface WebSocketMessage {
  event: string
  data: {
    newMessages?: EdenMessage[]
    thread_id?: string
    title?: string
    active?: string[]
  }
}
type MyRuntimeProviderProps = {
  agentId: string
  threadId?: string
  initialMessage?: {
    content: string
    attachments?: string[]
  }
} & PropsWithChildren

const TEMP_MESSAGE_KEY = 'chat-temp-message'

export function MyRuntimeProvider({
  children,
  agentId,
  threadId,
  initialMessage,
}: MyRuntimeProviderProps) {
  const [messages, setMessages] = useState<EdenMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { lastMessageJson } = useWebSocketContext()
  const currentThreadIdRef = useRef<string | undefined>()
  const { isSignedIn } = useAuthState()
  const initialMessageProcessedRef = useRef(false)

  // Add URL update tracking
  const lastUrlUpdateRef = useRef<string | null>(null)

  // Function to update URL without triggering Next.js navigation
  const updateUrlWithoutNavigation = (newThreadId?: string) => {
    const baseUrl = `/chat/${agentId}`
    const newUrl = newThreadId ? `${baseUrl}/${newThreadId}` : baseUrl

    // Skip if we're already at this URL
    if (lastUrlUpdateRef.current === newUrl) {
      return
    }

    // Update our ref before making changes to prevent loops
    lastUrlUpdateRef.current = newUrl

    // Update URL state without dispatching popstate
    const state = { ...window.history.state, as: newUrl, url: newUrl }
    window.history.pushState(state, '', newUrl)
  }

  // Handle temporary message from sessionStorage
  useEffect(() => {
    // Only process if we don't have a threadId (new chat) and haven't processed a message yet
    if (threadId || initialMessageProcessedRef.current) return

    const tempMessageJson = sessionStorage.getItem(TEMP_MESSAGE_KEY)
    if (!tempMessageJson) return

    try {
      const tempMessage = JSON.parse(tempMessageJson)

      // Create optimistic user message
      const userMessage: EdenMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: tempMessage.content,
        attachments: tempMessage.attachments || [],
        createdAt: new Date(tempMessage.timestamp),
      }

      console.log('[onNew] Setting isRunning and adding temp message', {
        messageId: userMessage.id,
        content: userMessage.content.slice(0, 20) + '...',
      })

      // Remove the temp message immediately to prevent reprocessing
      sessionStorage.removeItem(TEMP_MESSAGE_KEY)

      setIsRunning(true)
      setMessages([userMessage])
      initialMessageProcessedRef.current = true

      // Send the message
      sendMessage({
        messages: [userMessage],
        agentId: agentId,
        threadId: currentThreadIdRef.current,
      })
        .then(response => {
          if (response.status !== 200) {
            throw new Error('Failed to send message')
          }

          // If we get a new threadId back, update the URL and current thread reference
          const threadId = response.data?.thread_id as string | undefined
          if (threadId && threadId !== currentThreadIdRef.current) {
            currentThreadIdRef.current = threadId
            updateUrlWithoutNavigation(threadId)
          }
        })
        .catch(error => {
          console.error('[onNew] Error sending temp message:', error)
          setIsRunning(false)
          setMessages([]) // Clear the optimistic message on error
          toast.error('Failed to send message')
        })
    } catch (error) {
      console.error('Error processing temp message:', error)
      sessionStorage.removeItem(TEMP_MESSAGE_KEY)
    }
  }, [threadId, agentId])

  // Handle initial message if provided
  useEffect(() => {
    if (!initialMessage || initialMessageProcessedRef.current || threadId)
      return

    const processInitialMessage = async () => {
      // Create optimistic user message
      const userMessage: EdenMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: initialMessage.content,
        attachments: initialMessage.attachments || [],
        createdAt: new Date(),
      }

      console.log('[onNew] Setting isRunning and adding initial message', {
        messageId: userMessage.id,
        content: userMessage.content.slice(0, 20) + '...',
      })

      setIsRunning(true)
      setMessages([userMessage])
      initialMessageProcessedRef.current = true

      try {
        const response = await sendMessage({
          messages: [userMessage],
          agentId: agentId,
          threadId: currentThreadIdRef.current,
        })

        if (response.status !== 200) {
          throw new Error('Failed to send message')
        }

        // If we get a new threadId back, update the URL and current thread reference
        const threadId = response.data?.thread_id as string | undefined
        if (threadId && threadId !== currentThreadIdRef.current) {
          currentThreadIdRef.current = threadId
          updateUrlWithoutNavigation(threadId)
        }
      } catch (error) {
        console.error('[onNew] Error sending initial message:', error)
        setIsRunning(false)
        setMessages([]) // Clear the optimistic message on error
      }
    }

    processInitialMessage()
  }, [initialMessage, threadId, agentId])

  // Load initial thread if threadId is in URL
  useEffect(() => {
    if (threadId && threadId !== currentThreadIdRef.current) {
      const loadThread = async () => {
        try {
          const thread = await getThread(threadId)
          if (!thread.messages) {
            throw new Error('Thread has no messages')
          }

          const hasActiveMessages = Boolean(thread.active?.length)

          console.log('[Initial Thread Load] Setting messages and isRunning', {
            messageCount: thread.messages.length,
            isRunning: hasActiveMessages,
            active: thread.active,
          })

          // When loading a new thread, process messages based on active state
          const processedMessages = (thread.messages as EdenMessage[]).map(
            (message, index, array) => {
              if (message.role === 'assistant') {
                // Find the last user message before this assistant message
                const previousUserMessage = [...array]
                  .slice(0, index)
                  .reverse()
                  .find(m => m.role === 'user')

                // If this is the last assistant message and there are active messages, it might still be running
                const isLastAssistant = array
                  .slice(index + 1)
                  .every(m => m.role !== 'assistant')

                // Check if the previous user message is being processed
                const isPreviousUserActive =
                  previousUserMessage &&
                  thread.active?.includes(previousUserMessage.id)

                // Only mark as running if:
                // 1. The previous user message is in the active array (being processed)
                // 2. AND this is the last assistant message
                // 3. AND the last message in the thread is not an optimistic user message
                const lastMessage = array[array.length - 1]
                const hasOptimisticUserMessage =
                  lastMessage?.role === 'user' && !lastMessage.id

                if (
                  isLastAssistant &&
                  isPreviousUserActive &&
                  !hasOptimisticUserMessage
                ) {
                  return {
                    ...message,
                    status: { type: 'running' as const },
                  }
                }

                return {
                  ...message,
                  status: {
                    type: 'complete' as const,
                    reason: 'stop' as const,
                  },
                }
              }
              return message
            },
          )

          setMessages(processedMessages)
          setIsRunning(hasActiveMessages)
          currentThreadIdRef.current = threadId
        } catch (error) {
          console.error('Error loading initial thread:', error)
        }
      }
      loadThread()
    }
  }, [threadId])

  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessageJson || lastMessageJson.event !== 'thread-update') return

    const wsMessage = lastMessageJson as WebSocketMessage
    const { newMessages, active, thread_id } = wsMessage.data

    if (!newMessages?.length) return

    // Only process messages for the current thread
    if (thread_id !== currentThreadIdRef.current) {
      console.log('[WS Update] Ignoring message for different thread:', {
        receivedThreadId: thread_id,
        currentThreadId: currentThreadIdRef.current,
      })
      return
    }

    console.log('[WS Update] Processing update:', {
      newMessagesCount: newMessages.length,
      active,
      isRunning: Boolean(active?.length),
    })

    // Update messages first
    setMessages(current => {
      const updatedMessages = [...current]

      // First update/add new messages
      for (const newMessage of newMessages) {
        const existingMessageIndex = updatedMessages.findIndex(
          m => m.id === newMessage.id,
        )

        // Determine the correct status for assistant messages
        const determineAssistantStatus = (
          message: EdenMessage,
          index: number,
        ) => {
          // For non-assistant messages, keep their status
          if (message.role !== 'assistant') {
            return message.status
          }

          // For assistant messages:
          // 1. If it's not the last message, it should be complete
          const isLastMessage = index === updatedMessages.length - 1

          if (!isLastMessage) {
            return { type: 'complete' as const, reason: 'stop' as const }
          }

          // 2. If it is the last message:
          // First check if we have any tool calls
          if (message.tool_calls?.length) {
            // If any tool call is pending or doesn't have a result yet, the message is running
            const hasIncompleteToolCalls = message.tool_calls.some(
              call =>
                !call.status ||
                call.status === 'pending' ||
                !call.result ||
                (typeof call.result === 'object' &&
                  'status' in call.result &&
                  call.result.status === 'pending'),
            )

            // If message has tool calls and active array exists, it's definitely running
            if (hasIncompleteToolCalls || (active && active.length > 0)) {
              return { type: 'running' as const }
            }
          }

          // Then check active array - if we have active messages and this is the last message, it's running
          if (active && active.length > 0 && isLastMessage) {
            return { type: 'running' as const }
          }

          // Otherwise, use existing status or default to complete
          return (
            message.status || {
              type: 'complete' as const,
              reason: 'stop' as const,
            }
          )
        }

        if (existingMessageIndex === -1) {
          // For new messages
          console.log('[WS Update] Adding new message:', {
            id: newMessage.id,
            role: newMessage.role,
            isLastMessage: true,
            hasActiveArray: Boolean(active?.length),
            hasToolCalls: Boolean(newMessage.tool_calls?.length),
            hasPendingToolCalls: newMessage.tool_calls?.some(
              call => !call.status || call.status === 'pending',
            ),
            content:
              typeof newMessage.content === 'string'
                ? newMessage.content.slice(0, 20) + '...'
                : newMessage.content,
          })

          // If this is a new assistant message with tool calls, immediately mark it as running
          if (
            newMessage.role === 'assistant' &&
            newMessage.tool_calls?.length
          ) {
            updatedMessages.push({
              ...newMessage,
              status: { type: 'running' as const },
            })
            return updatedMessages
          }

          // Mark all assistant messages as complete until we hit a user message (going backwards)
          if (!active || active.length === 0) {
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              const message = updatedMessages[i]
              if (message.role === 'user') {
                break
              }
              if (message.role === 'assistant') {
                updatedMessages[i] = {
                  ...message,
                  status: {
                    type: 'complete' as const,
                    reason: 'stop' as const,
                  },
                }
              }
            }
          }

          // Then add the new message with determined status
          updatedMessages.push({
            ...newMessage,
            status: determineAssistantStatus(
              newMessage,
              updatedMessages.length,
            ),
          })
        } else {
          // For existing messages
          const oldStatus = updatedMessages[existingMessageIndex].status
          const newStatus = determineAssistantStatus(
            newMessage,
            existingMessageIndex,
          )

          // If this is an assistant message with tool calls and no content yet, keep it running
          if (
            newMessage.role === 'assistant' &&
            newMessage.tool_calls?.length &&
            (!newMessage.content || newMessage.content.length === 0)
          ) {
            updatedMessages[existingMessageIndex] = {
              ...updatedMessages[existingMessageIndex],
              ...newMessage,
              status: { type: 'running' as const },
            }
            return updatedMessages
          }

          console.log('[WS Update] Updating existing message:', {
            id: newMessage.id,
            role: newMessage.role,
            oldStatus,
            newStatus,
            isLastMessage: existingMessageIndex === updatedMessages.length - 1,
            hasActiveArray: Boolean(active?.length),
            hasToolCalls: Boolean(newMessage.tool_calls?.length),
            hasPendingToolCalls: newMessage.tool_calls?.some(
              call => !call.status || call.status === 'pending',
            ),
            content:
              typeof newMessage.content === 'string'
                ? newMessage.content.slice(0, 20) + '...'
                : newMessage.content,
          })

          updatedMessages[existingMessageIndex] = {
            ...updatedMessages[existingMessageIndex],
            ...newMessage,
            status: newStatus,
          }
        }
      }

      return updatedMessages
    })

    invalidate()

    // Update running state based ONLY on active array
    const newIsRunning = Boolean(active?.length)
    console.log(
      `[WS Update] ${
        newIsRunning
          ? 'Setting isRunning to true - user message being processed'
          : 'Setting isRunning to false - no user message being processed'
      }`,
    )
    setIsRunning(newIsRunning)

    if (!active?.length) {
      abortControllerRef.current?.abort()
    }
  }, [lastMessageJson])

  const onNew = async (message: ThreadMessageLike) => {
    if (
      !Array.isArray(message.content) ||
      message.content[0]?.type !== 'text'
    ) {
      throw new Error('Only text messages are supported')
    }

    const messageId = Date.now().toString()
    let attachmentsArr: string[] = []
    if (Array.isArray(message.attachments)) {
      attachmentsArr = message.attachments
        .map(att => att.name || att.id)
        .filter((id): id is string => typeof id === 'string')
    }

    const userMessage: EdenMessage = {
      id: messageId,
      role: 'user',
      content: message.content[0].text,
      attachments: attachmentsArr,
      createdAt: new Date(),
      status: undefined,
    }

    console.log('[onNew] Setting isRunning and adding user message', {
      messageId,
      content: message.content[0].text.slice(0, 20) + '...',
    })

    // Set running state immediately before adding the message
    setIsRunning(true)
    setMessages(current => [...current, userMessage])

    abortControllerRef.current = new AbortController()

    try {
      const response = await sendMessage({
        messages: [userMessage],
        agentId: agentId,
        threadId: currentThreadIdRef.current,
      })

      if (response.status !== 200) {
        throw new Error('Failed to send message')
      }

      // If we get a new threadId back, update the URL and current thread reference
      const threadId = response.data?.thread_id as string | undefined
      if (threadId && threadId !== currentThreadIdRef.current) {
        currentThreadIdRef.current = threadId
        updateUrlWithoutNavigation(threadId)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[onNew] Request aborted')
      } else {
        console.error('[onNew] Error sending message:', error)
        setIsRunning(false)
      }
    }
  }

  const {
    threads,
    invalidate,
    isFetchingNextPage: isFetchingNextPageThreads,
  } = useThreadListQuery({
    agentId,
    enabled: isSignedIn,
  })

  const threadMessages = useExternalMessageConverter({
    messages,
    isRunning,
    callback: (msg: EdenMessage): ThreadMessageLike => convertEdenMessage(msg),
  })

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: threadMessages,
    onNew,
    extras: {
      [symbolEdenExtras]: true,
      agentId,
      threadId: currentThreadIdRef.current,
      isReadOnly: false,
    },
    adapters: {
      feedback: edenFeedbackAdapter,
      attachments: new CompositeAttachmentAdapter([edenImageAttachmentAdapter]),
      threadList: {
        threadId: currentThreadIdRef.current,
        threads: threads?.map(thread => {
          const isCurrentThread = thread?._id === currentThreadIdRef.current
          return {
            id: thread?._id || Date.now().toString(),
            threadId: thread?._id || Date.now().toString(),
            title: thread?.title || 'Untitled',
            state:
              isFetchingNextPageThreads &&
              thread === threads[threads.length - 1]
                ? 'loading'
                : 'regular',
            status: 'regular' as const,
            selected: isCurrentThread,
          }
        }),
        onSwitchToThread: async (threadId: string) => {
          try {
            const thread = await getThread(threadId)
            if (!thread.messages) {
              throw new Error('Thread has no messages')
            }

            const hasActiveMessages = Boolean(thread.active?.length)

            console.log('[onSwitchToThread] Switching thread', {
              threadId,
              messageCount: thread.messages.length,
              isRunning: hasActiveMessages,
              active: thread.active,
            })

            // Update URL without triggering popstate
            updateUrlWithoutNavigation(threadId)

            // When switching threads, process messages based on active state
            const processedMessages = (thread.messages as EdenMessage[]).map(
              (message, index, array) => {
                if (message.role === 'assistant') {
                  // If this is the last assistant message and there are active messages, it might still be running
                  const isLastAssistant = array
                    .slice(index + 1)
                    .every(m => m.role !== 'assistant')
                  if (isLastAssistant && hasActiveMessages) {
                    return {
                      ...message,
                      status: { type: 'running' as const },
                    }
                  }
                  return {
                    ...message,
                    status: {
                      type: 'complete' as const,
                      reason: 'stop' as const,
                    },
                  }
                }
                return message
              },
            )

            // Update state in a single batch to prevent recursion
            const prevThreadId = currentThreadIdRef.current
            currentThreadIdRef.current = threadId
            if (prevThreadId !== threadId) {
              setMessages(processedMessages)
              setIsRunning(hasActiveMessages)
            }
          } catch (error) {
            console.error('Error switching to thread:', error)
            throw error
          }
        },
        onSwitchToNewThread: async () => {
          console.log('[onSwitchToNewThread] Creating new thread')

          // Guard against recursive calls
          if (!currentThreadIdRef.current) {
            console.log(
              '[onSwitchToNewThread] Already in new thread state, skipping',
            )
            return
          }

          // Update URL without triggering popstate
          updateUrlWithoutNavigation()

          // Reset the current state
          currentThreadIdRef.current = undefined
          setMessages([])
          setIsRunning(false)
        },
      },
    },
  })

  // Add effect to handle popstate events for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Extract threadId from URL on back/forward navigation
      const pathParts = window.location.pathname.split('/')
      const newThreadId = pathParts[3] // /chat/agentId/threadId

      // Update our URL tracking ref
      lastUrlUpdateRef.current = window.location.pathname

      // Guard against recursive navigation
      if (newThreadId === currentThreadIdRef.current) {
        console.log(
          '[handlePopState] Already in correct thread state, skipping',
        )
        return
      }

      if (newThreadId !== currentThreadIdRef.current) {
        if (newThreadId) {
          runtime.threads?.switchToThread(newThreadId).catch(console.error)
        } else {
          runtime.threads?.switchToNewThread().catch(console.error)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [agentId, runtime.threads])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}

// export function useEdenRuntimeExtras(): EdenExtras;
// export function useEdenRuntimeExtras<T>(selector: (extras: EdenExtras) => T): T;
export function useEdenRuntimeExtras<T>(
  selector: (extras: EdenExtras) => T = extras => extras as T,
): T {
  return useThread(t => {
    const extras = t.extras as EdenExtras
    // console.log('t', t)
    // console.log('extras', t.metadata.id, extras)
    // if (!extras[symbolEdenExtras])
    //   throw new Error(
    //     'useEdenRuntimeExtras can only be used inside a Eden runtime',
    //   )

    return selector(extras)
  })
}
