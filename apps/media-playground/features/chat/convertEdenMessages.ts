'use client'

import { MessageStatus, useExternalMessageConverter } from '@assistant-ui/react'
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
  content:
    | UserMessage['content']
    | AssistantMessage['content']
    | SystemMessage['content'],
) => {
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
      }
    case 'user':
      return {
        role: 'user',
        content: contentToParts(message.content),
        status: message.status,
      }
    case 'assistant':
      return {
        role: 'assistant',
        content: [
          ...contentToParts(message.content),
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
      }
  }
}
