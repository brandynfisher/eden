import { Schema, Types, model } from 'mongoose'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'

export interface UserIdentitySchema {
  provider: string
  provider_user_id: string
  eden_user_id?: Types.ObjectId | null
  status?: 'pending' | 'linked' | 'unlinked'
  linked_at?: Date | null
  unlinked_at?: Date | null
  metadata?: Record<string, unknown>
  created_at?: Date
  updated_at?: Date
  deleted?: boolean
}

export interface UserIdentityDocument
  extends SoftDeleteDocument,
    UserIdentitySchema {}

const userIdentitySchema = new Schema<UserIdentityDocument>(
  {
    provider: {
      type: String,
      required: true,
      index: true,
    },
    provider_user_id: {
      type: String,
      required: true,
      index: true,
    },
    eden_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'linked', 'unlinked'],
      default: 'pending',
    },
    linked_at: {
      type: Date,
      default: null,
    },
    unlinked_at: {
      type: Date,
      default: null,
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

userIdentitySchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

userIdentitySchema.index({ provider: 1, provider_user_id: 1 }, { unique: true })
userIdentitySchema.index({ eden_user_id: 1, provider: 1 })

export const UserIdentity = model<UserIdentityDocument>(
  'user_identities',
  userIdentitySchema,
) as SoftDeleteModel<UserIdentityDocument>
