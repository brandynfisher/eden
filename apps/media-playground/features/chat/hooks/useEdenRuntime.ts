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
} from '@assistant-ui/react'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export const useEdenRuntime = ({
  threadId,
  stream,
  onSwitchToNewThread,
  onSwitchToThread,
  onRename,
}: {
  threadId?: string | undefined
  stream: (
    messages: EdenMessage[],
  ) => Promise<AsyncGenerator<{ data: EdenMessage }>>
  onSwitchToNewThread?: () => Promise<void> | void
  onSwitchToThread?: (threadId: string) => Promise<{ messages: EdenMessage[] }>
  onRename?: (threadId: string, newTitle: string) => Promise<void>
}) => {
  const [isRunning, setIsRunning] = useState(false)

  const { messages, sendMessage, setMessages } = useEdenMessages({ stream })
  const { threads } = useThreadListQuery()

  const handleSendMessage = async (messages: EdenMessage[]) => {
    try {
      setIsRunning(true)
      console.log('handleSendMessage')
      await sendMessage(messages)
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

  // console.log({ threadId, threadMessages })
  // console.log({ threads, threadIds: threads?.map(thread => thread._id) })

  // console.log({isRunning, threadId, threadMessages})

  return useExternalStoreRuntime({
    isRunning,
    //@todo: fix this type issue
    //@ts-expect-error: Type error: Type 'ThreadMessage[]' is not assignable to type 'EdenMessage[]'
    messages: threadMessages,
    setMessages,
    adapters: {
      feedback: EdenFeedbackAdapter,
      attachments: new CompositeAttachmentAdapter([edenImageAttachmentAdapter]),
      threadList: {
        threadId,
        threads: threads?.map(thread => ({
          threadId: thread._id,
          title: thread.name,
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
    onNew: msg => {
      return handleSendMessage([
        {
          id: uuidv4(),
          role: 'user',
          content:
            msg.content && msg.content.length
              ? (msg.content[0] as TextContentPart).text
              : '',
          attachments: msg.attachments.map(attachment => attachment.name),
        },
      ])
    },
    metadata: {
      test: 123,
    },
  })
}
