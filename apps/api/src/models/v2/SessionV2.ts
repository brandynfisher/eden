import { AgentDocument } from '../Agent'
import { UserDocument } from '../User'
import { Message, MessageDocument } from './Message'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface SessionSchema {
  owner: UserDocument
  agents: AgentDocument[]
  status: 'active' | 'archived'
  title?: string
  channel?: string
  scenario?: string
  messages: MessageDocument[]
  budget?: number
  spent?: number
  createdAt: Date
  updatedAt: Date
}

export interface SessionInput {
  owner: ObjectId
}

export interface SessionDocument extends SessionSchema, SoftDeleteDocument {}

export const sessionSchema = new Schema<SessionDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    agents: {
      type: [Schema.Types.ObjectId],
      ref: 'users3',
    },
    status: {
      type: Schema.Types.String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    channel: {
      type: Schema.Types.String,
    },
    title: {
      type: Schema.Types.String,
    },
    scenario: {
      type: Schema.Types.String,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'messages',
      },
    ],
    budget: {
      type: Schema.Types.Number,
    },
    spent: {
      type: Schema.Types.Number,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// sessionSchema.index({ updatedAt: -1 })
// sessionSchema.index({ agents: 1, updatedAt: -1 })
// sessionSchema.index({ owner: 1, updatedAt: -1 })
// sessionSchema.index({ 'messages.role': 1, agents: 1 })
// sessionSchema.index({ agents: 1, owner: 1, updatedAt: -1 })
// sessionSchema.index({ 'messages.role': 1, 'messages.tool_calls': 1 })
// sessionSchema.index({ agents: 1, 'messages.role': 1, updatedAt: -1 })
// sessionSchema.index({
//   agents: 1,
//   'messages.role': 1,
//   'messages.tool_calls.task': 1,
//   'messages.tool_calls': 1,
// })
// sessionSchema.index({ 'messages.pinned': 1 })
sessionSchema.plugin(paginate)
sessionSchema.plugin(aggregatePaginate)
sessionSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

// Ensure Message model is registered before Session
if (!model('messages')) {
  model('messages', Message.schema)
}

export const Session = model<SessionDocument>(
  'sessions',
  sessionSchema,
) as SoftDeleteModel<SessionDocument>
