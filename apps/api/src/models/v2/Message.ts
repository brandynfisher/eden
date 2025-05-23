import { AgentDocument } from '../Agent'
import { UserDocument } from '../User'
import { SessionDocument } from './SessionV2'
import { MessageReaction, ToolCall } from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'

export interface MessageSchema {
  _id: string
  sender: UserDocument | AgentDocument
  session?: SessionDocument
  content?: string
  tool_calls?: ToolCall[]
  reply_to?: MessageDocument
  reactions?: MessageReaction
  createdAt?: Date
  updatedAt?: Date
}

export interface MessageDocument extends MessageSchema {}

const messageSchema = new Schema<MessageDocument>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: true,
    },
    content: {
      type: String,
    },
    tool_calls: {
      type: [Schema.Types.Mixed],
    },
    reply_to: {
      type: Schema.Types.ObjectId,
      ref: 'messages',
    },
    reactions: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Index for querying messages in a session
messageSchema.index({ session: 1, createdAt: 1 })

// Index for querying messages by sender
messageSchema.index({ sender: 1, createdAt: 1 })

export const Message = model<MessageDocument>('messages', messageSchema)
