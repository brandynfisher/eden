import { Creator } from '../Creators'
import { Agent } from './Agents'
import { TaskV2Args, TaskV2Result, TaskV2Status } from './TasksV2'

export type BaseMessage = {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  metadata?: { [key: string]: string | boolean | number }
  createdAt?: Date
}

export type UserMessageAttachments = string

export type BaseUserMessage = BaseMessage & {
  role: 'user'
  content: string
  attachments?: UserMessageAttachments[]
}

export type ToolCall = {
  id: string
  name: string
  error?: string
  status?: TaskV2Status
  tool?: string
  args: TaskV2Args
  result?: TaskV2Result[]
}

export type BaseMessageReaction = {
  [key: string]: (string | number | boolean | Date | null)[]
}

export type BaseContentMessage = {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content?: string
  reactions?: BaseMessageReaction
  pinned?: boolean
  sender?: Creator | Agent
  metadata?: {
    [key: string]: string | number | boolean | Date | null
  }
  reply_to?: string
  tool_calls?: ToolCall[]
  attachments?: string[]
  createdAt: Date
}

export type ToolResults = {
  id: string
  name: string
  result: string
  error?: string
}

export type BaseAssistantMessage = BaseMessage & {
  role: 'assistant'
  content: string
  status?: { type: 'running' | 'complete'; reason?: string }
  tool_calls?: ToolCall[]
}

export type BaseSystemMessage = BaseMessage & {
  role: 'system'
  content: string
}
