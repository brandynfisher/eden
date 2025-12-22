import { UserDocument } from '../User'
import { SessionDocument } from './SessionV2'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface SessionShareSchema {
  session: SessionDocument
  owner: UserDocument
  message_id: ObjectId
  title?: string
  /** For parent shares: maps agent IDs to their child share IDs */
  child_shares?: Record<string, ObjectId>
  /** For child shares: reference to the parent share */
  parent_share?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface SessionShareInput {
  session: ObjectId
  owner: ObjectId
  message_id: ObjectId
  title?: string
  child_shares?: Record<string, ObjectId>
  parent_share?: ObjectId
}

export interface SessionShareDocument
  extends SessionShareSchema,
    SoftDeleteDocument {}

export const sessionShareSchema = new Schema<SessionShareDocument>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'messages',
      required: true,
    },
    title: {
      type: Schema.Types.String,
      maxlength: 200,
    },
    child_shares: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    parent_share: {
      type: Schema.Types.ObjectId,
      ref: 'session_shares',
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

// Indexes for performance
sessionShareSchema.index({ session: 1, owner: 1 })
sessionShareSchema.index({ createdAt: -1 })

sessionShareSchema.plugin(paginate)
sessionShareSchema.plugin(aggregatePaginate)
sessionShareSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const SessionShare = model<SessionShareDocument>(
  'session_shares',
  sessionShareSchema,
) as SoftDeleteModel<SessionShareDocument>
