import { ThreadMessageLike } from '@assistant-ui/react'
import { Message } from '@edenlabs/eden-sdk'

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

export interface EdenMessage extends Message {
  role: 'user' | 'assistant'
  content: string
  attachments?: string[]
  tool_calls?: ToolCall[]
  reply_to?: string
  status?: {
    type: 'running' | 'complete'
    reason?: 'stop'
  }
}

export function convertEdenMessage(msg: EdenMessage): ThreadMessageLike {
  return {
    id: msg.id,
    role: msg.role,
    content: [
      {
        type: 'text' as const,
        text: msg.content,
      },
    ],
    metadata: msg.metadata,
    status: msg.status,
    createdAt: msg.createdAt,
  } as ThreadMessageLike
}
