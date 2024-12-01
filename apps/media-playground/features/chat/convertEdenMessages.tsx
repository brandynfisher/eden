'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  CompleteAttachment,
  MessageStatus,
  useExternalMessageConverter,
} from '@assistant-ui/react'
import { ToolCallContentPart } from '@assistant-ui/react'
import {
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '@edenlabs/eden-sdk'

export type EdenMessage = { status?: MessageStatus } & (
  | UserMessage
  | SystemMessage
  | AssistantMessage
  | ToolMessage
)

const contentToParts = (
  message: EdenMessage,
  content:
    | UserMessage['content']
    | AssistantMessage['content']
    | SystemMessage['content'],
) => {
  if (message.role === 'assistant') {
    if (
      message.status?.type === 'incomplete' &&
      message.status?.reason === 'error'
    ) {
      return [
        {
          type: 'ui' as const,
          display: (
            <Alert variant="destructive">
              <AlertTitle>Failed response!</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <Separator />
                <div>{content}</div>
              </AlertDescription>
            </Alert>
          ),
        },
      ]
    }
  }

  return [{ type: 'text' as const, text: content }]
}

export const convertEdenMessages: useExternalMessageConverter.Callback<
  EdenMessage
> = message => {
  switch (message.role) {
    case 'system':
      return {
        role: 'system',
        content: [{ type: 'text', text: message.content }],
        status: message.status,
        createdAt: message.createdAt,
      }
    case 'user':
      return {
        role: 'user',
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
        role: 'assistant',
        content: [
          ...contentToParts(message, message.content),
          ...(message.tool_calls?.map(
            (chunk): ToolCallContentPart => ({
              type: 'tool-call',
              toolCallId: chunk.id,
              toolName: chunk.name,
              args: chunk.input,
              argsText: JSON.stringify(chunk.input, null, 2),
              // result: chunk.input
            }),
          ) ?? []),
        ],
        status: message.status,
        createdAt: message.createdAt,
      }
    case 'tool':
      return {
        role: 'assistant',
        content: [
          ...(message.tool_results?.map(
            (chunk): ToolCallContentPart => ({
              type: 'tool-call',
              toolCallId: chunk.id,
              toolName: 'task_result',
              args: {},
              argsText: chunk.name,
              result: chunk.result,
            }),
          ) ?? []),
        ],
        status: message.status,
        createdAt: message.createdAt,
      }
  }
}
