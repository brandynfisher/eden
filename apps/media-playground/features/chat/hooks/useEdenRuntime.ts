import EdenFeedbackAdapter from '@/features/chat/eden-feedback-adapter'
import edenImageAttachmentAdapter from '@/features/chat/eden-image-attachment-adapter'
import {
  EdenMessage,
  edenMessageConverter,
} from '@/features/chat/eden-message-converter'
import { useEdenMessages } from '@/features/chat/hooks/useEdenMessages'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import {
  CompositeAttachmentAdapter,
  TextContentPart,
  useExternalMessageConverter,
  useExternalStoreRuntime,
  useThread,
} from '@assistant-ui/react'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const symbolEdenExtras = Symbol('eden-extras')

export type EdenExtras = {
  [symbolEdenExtras]: true
  threadTitle: string
}

export const useEdenRuntime = ({
  agentId,
  threadId,
  stream,
  onSwitchToNewThread,
  onSwitchToThread,
  onRename,
}: {
  agentId?: string
  threadId?: string
  stream: (
    messages: EdenMessage[],
    callback?: () => Promise<void>,
  ) => Promise<AsyncGenerator<{ data: EdenMessage }>>
  onSwitchToNewThread?: () => Promise<void> | void
  onSwitchToThread?: (threadId: string) => Promise<{ messages: EdenMessage[] }>
  onRename?: (threadId: string, newTitle: string) => Promise<void>
}) => {
  // const [threadTitle, setThreadTitle] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const { messages, sendMessage, setMessages } = useEdenMessages({ stream })
  const { threads, invalidate } = useThreadListQuery({ agentId })

  const handleSendMessage = async (
    messages: EdenMessage[],
    callback?: () => Promise<void>,
  ) => {
    try {
      setIsRunning(true)
      console.log('handleSendMessage')
      await sendMessage(messages, callback)
      console.log('handleSendMessage::done')
    } catch (error) {
      console.error('Error streaming messages:', error)
    } finally {
      console.log('finally isRunning false')
      setIsRunning(false)
    }
  }

  const threadMessages = useExternalMessageConverter({
    callback: edenMessageConverter,
    messages,
    isRunning,
  })

  return useExternalStoreRuntime({
    isRunning,
    //@todo: fix this type issue
    //@ts-expect-error: Type error: Type 'ThreadMessage[]' is not assignable to type 'EdenMessage[]'
    messages: threadMessages,
    // extras: useMemo(
    //   () =>
    //     ({
    //       [symbolEdenExtras]: true,
    //       threadTitle,
    //     }) satisfies EdenExtras,
    //   [threadTitle],
    // ),
    setMessages,
    adapters: {
      feedback: EdenFeedbackAdapter,
      attachments: new CompositeAttachmentAdapter([edenImageAttachmentAdapter]),
      threadList: {
        threadId,
        threads: threads?.map(thread => ({
          threadId: thread._id,
          title: thread.title,
          state: 'regular',
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
              // update optimistically or trigger thread list query invalidation
            },
      },
    },
    onNew: async msg => {
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
        async () => {
          console.log('callback')
          await invalidate()
          console.log('invalidated threadlist')
        },
      )
    },
  })
}

// export function useEdenRuntimeExtras(): EdenExtras;
// export function useEdenRuntimeExtras<T>(selector: (extras: EdenExtras) => T): T;
export function useEdenRuntimeExtras<T>(
  selector: (extras: EdenExtras) => T = extras => extras as T,
): T {
  return useThread(t => {
    const extras = t.extras as EdenExtras
    if (!extras[symbolEdenExtras])
      throw new Error(
        'useEdenRuntimeExtras can only be used inside a Eden runtime',
      )

    return selector(extras)
  })
}
