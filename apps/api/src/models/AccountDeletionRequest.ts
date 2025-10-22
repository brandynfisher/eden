import { Document, Schema, Types, model } from 'mongoose'

export interface AccountDeletionRequestSchema {
  user: Types.ObjectId
  userId: string
  email?: string
  status: 'pending' | 'completed' | 'cancelled'
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AccountDeletionRequestDocument
  extends AccountDeletionRequestSchema,
    Document {}

const AccountDeletionRequestSchema = new Schema<AccountDeletionRequestDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'baseUsers',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

AccountDeletionRequestSchema.index({ user: 1, status: 1 })
AccountDeletionRequestSchema.index({ userId: 1, createdAt: -1 })
AccountDeletionRequestSchema.index({ createdAt: -1 })

export const AccountDeletionRequest = model<AccountDeletionRequestDocument>(
  'accountDeletionRequest',
  AccountDeletionRequestSchema,
)
