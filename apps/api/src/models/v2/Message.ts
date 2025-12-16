import { AgentDocument } from '../Agent'
import { UserDocument } from '../User'
import { SessionDocument } from './SessionV2'
import {
  Channel,
  EdenMessageData,
  MessageReaction,
  MessageRole,
  Thought,
  ToolCall,
} from '@edenlabs/eden-sdk'
import { Schema, model } from 'mongoose'

export interface MessageSchema {
  _id: string
  session: SessionDocument[]
  sender: UserDocument | AgentDocument
  eden_user_id?: Schema.Types.ObjectId | null
  triggering_user?: Schema.Types.ObjectId | null
  billed_user?: Schema.Types.ObjectId | null
  agent_owner?: Schema.Types.ObjectId | null
  role: MessageRole
  eden_message_data?: EdenMessageData
  content: string
  name?: string
  tool_call_id?: string
  channel?: Channel
  reply_to?: MessageDocument
  reactions?: MessageReaction
  attachments?: string[]
  tool_calls?: ToolCall[]
  thought?: Thought[]
  apiKey?: string
  /** Reference to raw LLM call data in llm_calls collection */
  llm_call?: Schema.Types.ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

export interface MessageDocument extends MessageSchema {}

const messageSchema = new Schema<MessageDocument>(
  {
    session: [
      {
        type: Schema.Types.ObjectId,
        ref: 'sessions',
        required: true,
      },
    ],
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    eden_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    triggering_user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    billed_user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    agent_owner: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    role: {
      type: Schema.Types.String,
      enum: ['user', 'assistant', 'system', 'tool', 'eden'],
      required: true,
    },
    eden_message_data: {
      type: Schema.Types.Mixed,
    },
    content: {
      type: String,
    },
    name: {
      type: String,
    },
    tool_call_id: {
      type: String,
    },
    channel: {
      type: Schema.Types.Mixed,
    },
    tool_calls: {
      type: [Schema.Types.Mixed],
    },
    thought: {
      type: [Schema.Types.Mixed],
    },
    reply_to: {
      type: Schema.Types.ObjectId,
      ref: 'messages',
    },
    attachments: {
      type: [String],
      default: [],
    },
    reactions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    apiKey: {
      type: Schema.Types.ObjectId,
      ref: 'apikeys',
    },
    llm_call: {
      type: Schema.Types.ObjectId,
      ref: 'llm_calls',
      default: null,
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
messageSchema.index({ eden_user_id: 1, createdAt: 1 })
messageSchema.index({ billed_user: 1, role: 1, createdAt: 1 })
messageSchema.index({ triggering_user: 1, createdAt: 1 })
messageSchema.index({ agent_owner: 1, createdAt: 1 })

messageSchema.pre<MessageDocument>('save', function (next) {
  if (!this.eden_user_id && this.sender) {
    const senderValue = this.sender as any
    if (senderValue instanceof Schema.Types.ObjectId) {
      this.eden_user_id = senderValue
    } else if (senderValue?._id) {
      this.eden_user_id = senderValue._id
    }
  }
  next()
})

export const Message = model<MessageDocument>('messages', messageSchema)
