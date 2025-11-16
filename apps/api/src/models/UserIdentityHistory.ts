import { Schema, Types, model } from 'mongoose'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'

export interface UserIdentityHistorySchema {
  user_identity_id: Types.ObjectId
  eden_user_id?: Types.ObjectId
  actor_eden_user_id?: Types.ObjectId
  event_type: 'link' | 'unlink' | 'transfer'
  metadata?: Record<string, unknown>
  created_at?: Date
  updated_at?: Date
  deleted?: boolean
}

export interface UserIdentityHistoryDocument
  extends SoftDeleteDocument,
    UserIdentityHistorySchema {}

const userIdentityHistorySchema = new Schema<UserIdentityHistoryDocument>(
  {
    user_identity_id: {
      type: Schema.Types.ObjectId,
      ref: 'user_identities',
      required: true,
      index: true,
    },
    eden_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
    },
    actor_eden_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
    },
    event_type: {
      type: String,
      enum: ['link', 'unlink', 'transfer'],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
)

userIdentityHistorySchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

userIdentityHistorySchema.index({ event_type: 1, created_at: -1 })

export const UserIdentityHistory = model<UserIdentityHistoryDocument>(
  'user_identity_history',
  userIdentityHistorySchema,
) as SoftDeleteModel<UserIdentityHistoryDocument>
