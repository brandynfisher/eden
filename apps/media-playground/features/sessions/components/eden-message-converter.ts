import { getCloudfrontOriginalUrl } from '@/lib/media'
import { CompleteAttachment, ThreadMessageLike } from '@assistant-ui/react'
import {
  BaseThreadMessage,
  Thought,
  ThreadAssistantMessage,
  ThreadSystemMessage,
  ThreadUserMessage,
} from '@edenlabs/eden-sdk'

// Define ToolCallContentPart type since it's not exported from @assistant-ui/react
type ToolCallContentPart = {
  type: 'tool-call'
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  argsText: string
  result?: unknown
}

export interface ToolCall {
  id: string
  tool: string
  args: Record<string, unknown>
  task: string
  status: 'pending' | 'completed'
  result: unknown | null
  reactions: unknown | null
  error: unknown | null
}

export interface EdenMessage extends BaseThreadMessage {
  role: 'user' | 'assistant'
  content: string
  attachments?: string[]
  tool_calls?: ToolCall[]
  thought?: Thought[]
  reply_to?: string
  status?: {
    type: 'running' | 'complete'
    reason?: 'stop'
  }
}

const contentToParts = (
  message: EdenMessage,
  content:
    | ThreadUserMessage['content']
    | ThreadAssistantMessage['content']
    | ThreadSystemMessage['content'],
) => {
  if (message.role === 'assistant') {
    if (
      //@ts-expect-error message type is not correct
      message.status?.type === 'incomplete' &&
      //@ts-expect-error message type is not correct
      message.status?.reason === 'error'
    ) {
      return [
        {
          type: 'text' as const,
          text: `Failed Response! \`\`\`${content}\`\`\` `,
        },
      ]
    }
  }

  return [{ type: 'text' as const, text: content }]
}

export function convertEdenMessage(msg: EdenMessage): ThreadMessageLike {
  switch (msg.role) {
    case 'user':
      return {
        id: msg.id,
        role: 'user',
        metadata: msg.metadata,
        content: contentToParts(msg, msg.content),
        attachments: msg.attachments?.map(
          (attachment, idx) =>
            ({
              id: idx.toString(),
              type: 'image',
              name: attachment,
              content: [
                {
                  type: 'image',
                  image: getCloudfrontOriginalUrl(attachment),
                },
              ],
              // contentType: attachment.contentType ?? "unknown/unknown",
              contentType: 'image/png',
              status: { type: 'complete' },
            } satisfies CompleteAttachment),
        ),
        createdAt: msg.createdAt,
      }
    case 'assistant': {
      const convertedMessage = {
        id: msg.id,
        role: msg.role,
        content: [
          ...contentToParts(msg, msg.content),
          ...(msg.tool_calls?.map(
            (chunk): ToolCallContentPart => ({
              type: 'tool-call',
              toolCallId: chunk.id,
              toolName: 'task_result',
              args: chunk.args,
              argsText: JSON.stringify(chunk.args, null, 2),
              result: {
                tool: chunk.tool,
                status: chunk.status,
                result: chunk.result,
                error: chunk.error,
              },
            }),
          ) ?? []),
        ],
        metadata: {
          ...msg.metadata,
          thought: msg.thought,
        },
        status: msg.status,
        createdAt: msg.createdAt,
      } as ThreadMessageLike

      return convertedMessage
    }
  }
}
