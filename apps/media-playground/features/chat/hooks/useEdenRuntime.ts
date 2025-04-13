'use client'

import EdenFeedbackAdapter from '@/features/chat/eden-feedback-adapter'
import edenImageAttachmentAdapter from '@/features/chat/eden-image-attachment-adapter'
import { edenMessageConverter } from '@/features/chat/eden-message-converter'
import {
  ThreadMessageWithStatus,
  useEdenMessages,
} from '@/features/chat/hooks/useEdenMessages'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  AppendMessage,
  CompositeAttachmentAdapter,
  TextContentPart,
  useExternalMessageConverter,
  useExternalStoreRuntime,
  useThread,
} from '@assistant-ui/react'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const symbolEdenExtras = Symbol('eden-extras')

export type EdenExtras = {
  [symbolEdenExtras]: true
  agentId: string
  threadId: string
  isReadOnly?: boolean
}

export function useEdenRuntime({
  agentId,
  threadId,
  stream,
  onSwitchToNewThread,
  onSwitchToThread,
  onRename,
  isReadOnly,
  abortCurrentStream,
}: {
  agentId: string
  threadId: string | undefined
  stream: (
    messages: ThreadMessageWithStatus[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<{ data: ThreadMessageWithStatus }>>
  onSwitchToNewThread: () => Promise<void>
  onSwitchToThread: (threadId: string) => Promise<{
    messages: ThreadMessageWithStatus[]
    active: string[]
    shouldBeActive: boolean
  }>
  onRename?: (threadId: string, newTitle: string) => Promise<void>
  isReadOnly?: boolean | null
  abortCurrentStream?: () => void
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { isSignedIn } = useAuthState()

  const { messages, sendMessage, setMessages, addOrUpdateMessage } =
    useEdenMessages({
      stream: stream,
      setIsRunning,
      setIsSending,
    })
  const { threads, invalidate, hasMore, fetchNextPage, isFetchingNextPage } =
    useThreadListQuery({
      agentId,
      enabled: isSignedIn,
    })

  // Add mounted ref to prevent state updates after unmount
  const isMounted = useRef(true)
  const currentThreadIdRef = useRef<string | undefined>(threadId)

  // Log initial mount and config
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Track thread changes
  useEffect(() => {
    currentThreadIdRef.current = threadId
  }, [threadId])

  // Track running state changes
  useEffect(() => {
    console.log('[EdenRuntime] Running state changed', {
      isRunning,
      threadId: currentThreadIdRef.current,
      timestamp: new Date().toISOString(),
    })
  }, [isRunning])

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || !threads?.length || isFetchingNextPage) return

    const target = document.getElementById('thread-list-observer-target')
    if (!target) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, threads, isFetchingNextPage, fetchNextPage])

  // Log relevant state changes for debugging
  useEffect(() => {
    console.log('[EdenRuntime] State Change Debug', {
      isRunning,
      isSending,
      lastMessage: messages[messages.length - 1],
      timestamp: new Date().toISOString(),
    })
  }, [isRunning, isSending, messages])

  // Simplified converter
  function uiMessageToEdenMessageStatus(
    uiMessage: AppendMessage,
  ): ThreadMessageWithStatus {
    console.log(
      '[EdenRuntime] uiMessageToEdenMessageStatus input:',
      JSON.stringify(uiMessage),
    )
    let contentStr: string | undefined = undefined
    if (typeof uiMessage.content === 'string') {
      contentStr = uiMessage.content
    } else if (Array.isArray(uiMessage.content)) {
      contentStr = uiMessage.content
        .filter((part): part is TextContentPart => part.type === 'text')
        .map(part => part.text)
        .join('\\n')
    }

    let attachmentsArr: string[] = []
    if (Array.isArray(uiMessage.attachments)) {
      attachmentsArr = uiMessage.attachments
        .map(att => att.name || att.id)
        .filter((id): id is string => typeof id === 'string')
    }

    // Extract metadata more safely
    const metadata =
      (
        uiMessage as AppendMessage & {
          metadata?: Record<string, string | number | boolean | Date | null>
        }
      ).metadata || {}

    // Construct the message
    const result: Partial<ThreadMessageWithStatus> = {
      id: uuidv4(),
      role: uiMessage.role as ThreadMessageWithStatus['role'],
      content: contentStr,
      attachments: attachmentsArr,
      createdAt: new Date(),
      status: undefined, // Initial status is undefined for user messages
      metadata: metadata,
    }
    console.log(
      '[EdenRuntime] uiMessageToEdenMessageStatus output:',
      JSON.stringify(result),
    )
    return result as ThreadMessageWithStatus
  }

  const handleSendMessage = async (
    messagesToSend: ThreadMessageWithStatus[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => {
    console.log(
      '[EdenRuntime] handleSendMessage sending:',
      JSON.stringify(
        messagesToSend.map(m => ({
          id: m.id,
          role: m.role,
          status: m.status,
          metadata: m.metadata,
        })),
      ),
    )
    try {
      setIsSending(true)
      const responseGenerator = await sendMessage(messagesToSend, callback)
      if (!responseGenerator) {
        console.error('[EdenRuntime] No response generator')
        if (isMounted.current) {
          setIsSending(false)
        }
        return
      }
      console.log('[EdenRuntime] handleSendMessage received generator')
      for await (const message of responseGenerator) {
        if (!isMounted.current) {
          console.log(
            '[EdenRuntime] handleSendMessage loop: Unmounted, breaking',
          )
          break
        }
        console.log(
          '[EdenRuntime] handleSendMessage loop: Received message, calling addOrUpdateMessage',
          JSON.stringify({
            id: message.data.id,
            status: message.data.status,
            metadata: message.data.metadata,
          }),
        )
        addOrUpdateMessage(message.data, message.data.active)
      }
      console.log('[EdenRuntime] handleSendMessage loop: Finished iteration')
    } catch (error) {
      console.error('[EdenRuntime] handleSendMessage Error:', error)
    } finally {
      console.log(
        '[EdenRuntime] handleSendMessage finally block. isMounted:',
        isMounted.current,
      )
      if (isMounted.current) {
        // Force completion status for any remaining running assistant messages
        setMessages(currentMessages => {
          let changed = false
          const updatedMessages = currentMessages.map(msg => {
            if (msg.role === 'assistant' && msg.status?.type === 'running') {
              changed = true
              return {
                ...msg,
                status: { type: 'complete' as const, reason: 'stop' as const },
              }
            }
            return msg
          })
          // Only update state if something actually changed
          return changed ? updatedMessages : currentMessages
        })
        setIsSending(false)
      }
    }
  }

  // Converts Hook State (ThreadMessageWithStatus[]) -> UI State (EdenMessage[])
  // Slim down logging to only relevant fields
  console.log(
    '[EdenRuntime] Input messages to useExternalMessageConverter:',
    JSON.stringify(
      messages.map(m => ({ id: m.id, status: m.status, metadata: m.metadata })),
    ),
  )
  const threadMessages = useExternalMessageConverter({
    callback: edenMessageConverter,
    // WORKAROUND: Cast messages to any due to potential type mismatch in useExternalMessageConverter hook definition.
    // It seems to expect the output type (EdenMessage[]) instead of the input type (ThreadMessageWithStatus[]).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    isRunning,
  })
  // Slim down logging to only relevant fields
  console.log(
    '[EdenRuntime] Output messages from useExternalMessageConverter (threadMessages):',
    JSON.stringify(
      threadMessages.map(m => ({
        id: m.id,
        status: m.status,
        metadata: m.metadata,
      })),
    ),
  )

  return {
    addOrUpdateMessage,
    setMessages,
    setIsRunning,
    setIsSending,
    runtime: useExternalStoreRuntime({
      isRunning,
      messages: threadMessages,
      extras: {
        isReadOnly,
        agentId,
        threadId,
      },
      adapters: {
        feedback: EdenFeedbackAdapter,
        attachments: new CompositeAttachmentAdapter([
          edenImageAttachmentAdapter,
        ]),
        threadList: {
          threadId,
          threads: threads?.map(thread => ({
            threadId: thread?._id || Date.now().toString(),
            title: thread?.title || 'Untitled',
            state:
              isFetchingNextPage && thread === threads[threads.length - 1]
                ? 'loading'
                : 'regular',
            status: 'regular',
          })),
          onSwitchToNewThread: !onSwitchToNewThread
            ? undefined
            : async () => {
                // Keep abortion for thread switching
                abortCurrentStream?.()
                setIsRunning(false)
                setIsSending(false)
                await onSwitchToNewThread()
                setMessages([])
                currentThreadIdRef.current = undefined
              },
          onSwitchToThread: !onSwitchToThread
            ? undefined
            : async (newThreadId: string) => {
                // Keep abortion for thread switching
                abortCurrentStream?.()

                try {
                  const { messages, shouldBeActive } = await onSwitchToThread(
                    newThreadId,
                  )
                  currentThreadIdRef.current = newThreadId
                  setIsRunning(shouldBeActive)
                  setIsSending(false)
                  setMessages(messages)
                } catch (error) {
                  console.error('[EdenRuntime] Error switching thread:', error)
                  setIsRunning(false)
                  setIsSending(false)
                }
              },
          onRename: !onRename
            ? undefined
            : async (threadId, newTitle) => {
                await onRename(threadId, newTitle)
              },
        },
      },
      onNew: async (msg: AppendMessage) => {
        console.log('[EdenRuntime] onNew received:', JSON.stringify(msg))
        if (isReadOnly) {
          console.warn(
            '[EdenRuntime] Attempted to create new message in read-only mode',
          )
          return
        }
        const messageToSend = uiMessageToEdenMessageStatus(msg)
        return handleSendMessage(
          [messageToSend],
          async (newThreadId?: string) => {
            console.log(
              '[EdenRuntime] onNew handleSendMessage callback. newThreadId:',
              newThreadId,
            )
            if (typeof window !== 'undefined' && newThreadId) {
              window.history.pushState(
                null,
                '',
                `/chat/${agentId}/${newThreadId}`,
              )
            }
            setTimeout(async () => {
              console.log(
                '[EdenRuntime] onNew handleSendMessage callback: Invalidating query cache',
              )
              await invalidate()
            }, 2000)
          },
        )
      },
    }),
  }
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
