'use client'

import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  CompleteAttachment,
  MessageStatus,
  ThreadMessageLike,
} from '@assistant-ui/react'
import { ToolCallContentPart } from '@assistant-ui/react'
import {
  AssistantMessage,
  SystemMessage,
  UserMessage,
} from '@edenlabs/eden-sdk'

export type EdenMessage = { status?: MessageStatus } & (
  | UserMessage
  | SystemMessage
  | AssistantMessage
)
// | ToolMessage

const contentToParts = (
  message: EdenMessage,
  content:
    | UserMessage['content']
    | AssistantMessage['content']
    | SystemMessage['content'],
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

export const convertEdenMessage = (message: EdenMessage) => {
  return edenMessageConverter(message)
}

export const edenMessageConverter = (
  message: EdenMessage,
): ThreadMessageLike => {
  // console.log('convertEdenMessage', 'assistant', message)
  // console.log('convertEdenMessage', message.tool_calls?.[message.tool_calls.length - 1]?.result?.status)
  let lastToolCall
  // console.log("edenMessageConverter CALLED", message)

  if (message.role === 'assistant' && message.tool_calls?.length) {
    // console.log('convertEdenMessage', lastToolCall && (lastToolCall.status === 'pending' || lastToolCall.status === 'running') ? { type: 'running' } : message.status)
    lastToolCall = message?.tool_calls?.[message.tool_calls.length - 1]
    console.log('convertEdenMessage', lastToolCall.status, lastToolCall)
  }

  switch (message.role) {
    case 'system':
      return {
        id: message.id,
        role: 'system',
        metadata: message.metadata,
        content: [{ type: 'text', text: message.content }],
        status: message.status,
        createdAt: message.createdAt,
      }
    case 'user':
      return {
        id: message.id,
        role: 'user',
        metadata: message.metadata,
        content: contentToParts(message, message.content),
        attachments: message.attachments?.map(
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
        status: message.status,
        createdAt: message.createdAt,
      }
    case 'assistant':
      return {
        id: message.id,
        role: 'assistant',
        metadata: message.metadata,
        content: [
          ...contentToParts(message, message.content),
          ...(message.tool_calls?.map(
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
        // status: getToolCallStatus(message),
        status:
          lastToolCall &&
          (lastToolCall.status === 'pending' ||
            lastToolCall.status === 'running')
            ? { type: 'running' }
            : { type: 'complete', reason: 'stop' },
        createdAt: message.createdAt,
      }
  }
}
