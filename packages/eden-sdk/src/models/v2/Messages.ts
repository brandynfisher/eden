import { Creator } from 'src/models/Creators'
import { Agent, SessionV2, ToolCall } from 'src/models/v2'

export type MessageReaction = {
  [key: string]: (string | number | boolean | Date | null)[]
}

type ChannelType = 'eden' | 'discord' | 'telegram' | 'twitter'

export type Channel = {
  type: ChannelType
  key: string
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export type Message = {
  _id: string
  session: SessionV2
  sender: Creator | Agent
  role: MessageRole
  content: string
  name?: string
  tool_call_id?: string
  channel?: Channel
  reply_to?: Message
  sender_name?: string
  reactions?: MessageReaction
  attachments?: string[]
  tool_calls?: ToolCall[]
  createdAt: Date
  updatedAt: Date
}
