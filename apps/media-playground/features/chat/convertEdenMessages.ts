'use client'

import { useExternalMessageConverter } from '@assistant-ui/react'
import { ToolCallContentPart } from '@assistant-ui/react'
import {
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '@edenlabs/eden-sdk'

export type EdenMessage =
  | UserMessage
  | SystemMessage
  | AssistantMessage
  | ToolMessage

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
        // id: message.id,
        content: [{ type: 'text', text: message.content }],
      }
    case 'user':
      return {
        role: 'user',
        // id: message.id,
        content: contentToParts(message.content),
      }
    case 'assistant':
      return {
        role: 'assistant',
        // id: message.id,
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
      }
    case 'tool':
      return {
        role: 'assistant',
        // toolCallId: 'string',
        // result: '',
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
      }
  }
}
