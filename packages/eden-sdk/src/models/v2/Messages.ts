import { Creator } from 'src/models/Creators'
import { Agent, SessionV2, ToolCall } from 'src/models/v2'

export type MessageReaction = {
  [key: string]: (string | number | boolean | Date | null)[]
}

export type Message = {
  _id: string
  sender: Creator | Agent
  session?: SessionV2
  content?: string
  tool_calls?: ToolCall[]
  reply_to?: Message
  reactions?: MessageReaction
  createdAt: Date
  updatedAt: Date
}
