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
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

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
}: {
  agentId?: string
  threadId?: string
  stream: (
    messages: EdenMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<{ data: EdenMessage }>>
  onSwitchToNewThread?: () => Promise<void> | void
  onSwitchToThread?: (threadId: string) => Promise<{ messages: EdenMessage[] }>
  onRename?: (threadId: string, newTitle: string) => Promise<void>
  isReadOnly?: boolean | null
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

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

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
    // Don't allow sending messages in read-only mode
    if (isReadOnly) {
      console.warn('Attempted to send message in read-only mode')
      return
    }

    try {
      setIsRunning(true)
      await sendMessage(messages, callback)
    } catch (error) {
      console.error('Error streaming messages:', error)
    } finally {
      if (isMounted.current) {
        setIsRunning(false)
      }
    }
  }

  const threadMessages = useExternalMessageConverter({
    callback: edenMessageConverter,
    messages,
    isRunning,
  })

  return {
    addOrUpdateMessage,
    setMessages,
    setIsRunning,
    runtime: useExternalStoreRuntime({
      isRunning,
      //@todo: fix this type issue
      //@ts-expect-error: Type error: Type 'ThreadMessage[]' is not assignable to type 'EdenMessage[]'
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
                await onSwitchToNewThread()
                setMessages([])
              },
          onSwitchToThread: !onSwitchToThread
            ? undefined
            : async threadId => {
                const { messages } = await onSwitchToThread(threadId)
                setMessages(messages)
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
              console.log('invalidated threadlist')
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
