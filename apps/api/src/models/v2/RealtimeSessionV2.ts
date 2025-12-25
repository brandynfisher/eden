import { AgentDocument } from '../Agent'
import { UserDocument } from '../User'
import { SessionDocument } from './SessionV2'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

export type RealtimeSessionStatus = 'active' | 'closed'

export type RealtimeSessionClosedReason =
  | 'user'
  | 'timeout'
  | 'error'
  | 'insufficient_balance'

export interface RealtimeSessionSchema {
  user: UserDocument
  agent: AgentDocument
  session: SessionDocument
  status: RealtimeSessionStatus
  startedAt: Date
  closedAt?: Date
  lastActivityAt: Date
  totalMinutesBilled: number
  closedReason?: RealtimeSessionClosedReason
  createdAt?: Date
  updatedAt?: Date
}

export interface RealtimeSessionInput {
  user: UserDocument['_id']
  agent: AgentDocument['_id']
  session: SessionDocument['_id']
  status?: RealtimeSessionStatus
  startedAt?: Date
  lastActivityAt?: Date
  totalMinutesBilled?: number
}

export interface RealtimeSessionDocument
  extends RealtimeSessionSchema,
    Document {}

const realtimeSessionSchema = new Schema<RealtimeSessionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    startedAt: {
      type: Schema.Types.Date,
      required: true,
      default: () => new Date(),
    },
    closedAt: {
      type: Schema.Types.Date,
    },
    lastActivityAt: {
      type: Schema.Types.Date,
      required: true,
      default: () => new Date(),
    },
    totalMinutesBilled: {
      type: Schema.Types.Number,
      default: 0,
    },
    closedReason: {
      type: Schema.Types.String,
      enum: ['user', 'timeout', 'error', 'insufficient_balance'],
    },
  },
  {
    timestamps: true,
    collection: 'realtime_sessions',
  },
)

// Index for finding active sessions by user
realtimeSessionSchema.index({ user: 1, status: 1 })
// Index for finding sessions to check for inactivity
realtimeSessionSchema.index({ status: 1, lastActivityAt: 1 })
// Index for linking to chat session
realtimeSessionSchema.index({ session: 1 })

realtimeSessionSchema.plugin(paginate)

export const RealtimeSession = model<RealtimeSessionDocument>(
  'realtime_sessions',
  realtimeSessionSchema,
)
