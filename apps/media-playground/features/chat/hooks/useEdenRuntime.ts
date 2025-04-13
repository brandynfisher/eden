'use client'

import EdenFeedbackAdapter from '@/features/chat/eden-feedback-adapter'
import edenImageAttachmentAdapter from '@/features/chat/eden-image-attachment-adapter'
import {
  EdenMessage,
  edenMessageConverter,
} from '@/features/chat/eden-message-converter'
import { useEdenMessages } from '@/features/chat/hooks/useEdenMessages'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  CompositeAttachmentAdapter,
  TextContentPart,
  useExternalMessageConverter,
  useExternalStoreRuntime,
  useThread,
} from '@assistant-ui/react'
import { AssistantMessage, ThreadMessage } from '@edenlabs/eden-sdk'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type ThreadMessageWithStatus = ThreadMessage & {
  status?: AssistantMessage['status']
}

const symbolEdenExtras = Symbol('eden-extras')

export type EdenExtras = {
  [symbolEdenExtras]: true
  agentId: string
  threadId: string
  isReadOnly?: boolean
}

export const useEdenRuntime = ({
  agentId,
  threadId,
  stream,
  onSwitchToNewThread,
  onSwitchToThread,
  onRename,
  isReadOnly,
  abortCurrentStream,
}: {
  agentId?: string
  threadId?: string
  stream: (
    messages: ThreadMessageWithStatus[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<
    AsyncGenerator<{ data: ThreadMessageWithStatus & { active?: string[] } }>
  >
  onSwitchToNewThread?: () => Promise<void> | void
  onSwitchToThread?: (threadId: string) => Promise<{
    messages: ThreadMessageWithStatus[]
    active: string[]
    shouldBeActive: boolean
  }>
  onRename?: (threadId: string, newTitle: string) => Promise<void>
  isReadOnly?: boolean | null
  abortCurrentStream?: () => void
}) => {
  const [isRunning, setIsRunning] = useState(false)
  const { isSignedIn } = useAuthState()
  const { messages, sendMessage, setMessages, addOrUpdateMessage } =
    useEdenMessages({ stream })
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

  const handleSendMessage = async (
    messages: EdenMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => {
    let responseGenerator: AsyncGenerator<{
      data: ThreadMessageWithStatus & { active?: string[] }
    }> | null = null

    try {
      console.log('[EdenRuntime] Sending message', {
        messageCount: messages.length,
        threadId: currentThreadIdRef.current,
        timestamp: new Date().toISOString(),
      })

      // Set running state before starting stream
      setIsRunning(true)

      // Get the generator from sendMessage
      // @ts-expect-error: Type mismatch might still exist depending on TMessage definition
      responseGenerator = await sendMessage(messages, callback)

      // Check if generator is valid before iterating
      if (responseGenerator) {
        // Iterate through the generator to process messages
        for await (const message of responseGenerator) {
          if (!isMounted.current) {
            console.log(
              '[EdenRuntime] Component unmounted during message processing',
            )
            // Don't break here - let the finally block handle cleanup
            continue
          }
          // Ensure addOrUpdateMessage is called for each yielded message
          // Added type assertion to resolve mismatch - review types later if needed
          addOrUpdateMessage(message.data as TMessage, message.data.active)
        }
      } else {
        console.error(
          '[EdenRuntime] sendMessage did not return a valid generator',
        )
      }
    } catch (error) {
      console.error('[EdenRuntime] Error processing message stream:', error)
      // Don't reset running state here - let finally block handle it
    } finally {
      // Only reset running state if we're still mounted and there are no active messages
      if (isMounted.current) {
        // Check both the current messages and the new messages for running state
        const hasActiveMessages = messages.some(
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

        // Only reset running state if there are no active messages
        if (!hasActiveMessages) {
          console.log(
            '[EdenRuntime] No active messages found, resetting running state',
            {
              threadId: currentThreadIdRef.current,
              timestamp: new Date().toISOString(),
            },
          )
          setIsRunning(false)
        } else {
          console.log(
            '[EdenRuntime] Active messages found, maintaining running state',
            {
              threadId: currentThreadIdRef.current,
              timestamp: new Date().toISOString(),
            },
          )
        }
      }
    }
  }

  const threadMessages = useExternalMessageConverter({
    callback: edenMessageConverter,
    // @ts-expect-error: Type mismatch between ThreadMessageWithStatus and EdenMessage needs to be resolved
    messages,
    isRunning,
  })

  return {
    addOrUpdateMessage,
    setMessages,
    setIsRunning,
    runtime: useExternalStoreRuntime({
      isRunning,
      // @ts-expect-error: Type mismatch between ThreadMessage and EdenMessage needs to be resolved
      messages: threadMessages,
      setMessages,
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
                // Reset running state before switching
                setIsRunning(false)
                // ADDED: Abort any potentially running stream
                abortCurrentStream?.()
                await onSwitchToNewThread()
                setMessages([])
                currentThreadIdRef.current = undefined
              },
          onSwitchToThread: !onSwitchToThread
            ? undefined
            : async (newThreadId: string) => {
                // console.log('useEdenRuntime.onSwitchToThread - start', {
                //   newThreadId,
                //   currentThreadId: currentThreadIdRef.current,
                // })

                // ADDED: Abort any potentially running stream *before* fetching new data
                abortCurrentStream?.()

                try {
                  // Don't reset running state until we have new thread data
                  const { messages, shouldBeActive } = await onSwitchToThread(
                    newThreadId,
                  )

                  // Update current thread ID after successful switch
                  currentThreadIdRef.current = newThreadId

                  // console.log('useEdenRuntime.onSwitchToThread - got data', {
                  //   threadId: newThreadId,
                  //   currentThreadId: currentThreadIdRef.current,
                  //   messageCount: messages.length,
                  //   hasRunning: messages.some(
                  //     m => m.status?.type === 'running',
                  //   ),
                  //   active,
                  //   lastMessage: messages[messages.length - 1],
                  // })

                  // Process messages to determine running state
                  // REMOVED: Calculation is done in provider now
                  // const hasRunningMessage = messages.some(
                  //   m =>
                  //     m.status?.type === 'running' ||
                  //     m.tool_calls?.some(
                  //       call =>
                  //         !call.status ||
                  //         call.status === 'running' ||
                  //         call.status === 'pending',
                  //     ),
                  // )
                  // const hasActive = active && active.length > 0
                  // const shouldBeRunning = hasRunningMessage || hasActive

                  // Update state after getting new data
                  // console.log('useEdenRuntime.onSwitchToThread - setting state', {
                  //   threadId: newThreadId,
                  //   shouldBeRunning,
                  // })
                  setIsRunning(shouldBeActive) // UPDATED: Use returned value directly
                  setMessages(messages)
                } catch (error) {
                  console.error('[EdenRuntime] Error switching thread:', error)
                  // Ensure running state is false on error
                  setIsRunning(false)
                } finally {
                  // Invalidate thread list if needed (might not be necessary here)
                  // invalidate()
                }
              },
          onRename: !onRename
            ? undefined
            : async (threadId, newTitle) => {
                await onRename(threadId, newTitle)
              },
        },
      },
      onNew: async msg => {
        // Don't allow new messages in read-only mode
        if (isReadOnly) {
          console.warn('Attempted to create new message in read-only mode')
          return
        }

        return handleSendMessage(
          [
            {
              id: uuidv4(),
              role: 'user',
              content:
                msg.content && msg.content.length
                  ? (msg.content[0] as TextContentPart).text
                  : '',
              attachments: msg.attachments.map(attachment => attachment.name),
            },
          ],
          async (newThreadId?: string) => {
            if (typeof window !== 'undefined')
              window.history.pushState(
                null,
                '',
                `/chat/${agentId}/${newThreadId}`,
              )
            setTimeout(async () => {
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

// Define TMessage - using ThreadMessageWithStatus seems more appropriate here
type TMessage = ThreadMessageWithStatus
