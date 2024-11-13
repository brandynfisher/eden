import {
  EdenMessage,
  convertEdenMessages,
} from '@/features/chat/convertEdenMessages'
import { useEdenMessages } from '@/features/chat/hooks/useEdenMessages'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import {
  TextContentPart,
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import { SimpleImageAttachmentAdapter } from '@assistant-ui/react'
import { useState } from 'react'

//
// const getPendingToolCalls = (messages: LangChainMessage[]) => {
//   const pendingToolCalls = new Map<string, LangChainToolCall>();
//   for (const message of messages) {
//     if (message.type === "ai") {
//       for (const toolCall of message.tool_calls ?? []) {
//         pendingToolCalls.set(toolCall.id, toolCall);
//       }
//     }
//     if (message.type === "tool") {
//       pendingToolCalls.delete(message.tool_call_id);
//     }
//   }
//
//   return [...pendingToolCalls.values()];
// };

export const useEdenRuntime = ({
  threadId,
  stream,
  onSwitchToNewThread,
  onSwitchToThread,
}: {
  threadId?: string | undefined
  stream: (
    messages: EdenMessage[],
  ) => Promise<AsyncGenerator<{ data: EdenMessage }>>
  onSwitchToNewThread?: () => Promise<void> | void
  onSwitchToThread?: (threadId: string) => Promise<{ messages: EdenMessage[] }>
}) => {
  const [isRunning, setIsRunning] = useState(false)

  const { messages, sendMessage, setMessages } = useEdenMessages({ stream })
  const { threads } = useThreadListQuery()

  console.log('useEdenRuntime', { threadId, threads, messages })

  const handleSendMessage = async (messages: EdenMessage[]) => {
    try {
      setIsRunning(true)
      await sendMessage(messages)
    } catch (error) {
      console.error('Error streaming messages:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const threadMessages = useExternalMessageConverter({
    callback: convertEdenMessages,
    messages,
    isRunning,
  })

  console.log({ messages })

  return useExternalStoreRuntime({
    isRunning,
    messages: threadMessages,
    setMessages,
    adapters: {
      attachments: new SimpleImageAttachmentAdapter(),
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
      },
    },
    onNew: msg => {
      return handleSendMessage([
        {
          role: 'user',
          content:
            msg.content && msg.content.length
              ? (msg.content[0] as TextContentPart).text
              : '',
          attachments: msg.attachments.map(attachment => attachment.name),
        },
      ])
    },
  })
}
