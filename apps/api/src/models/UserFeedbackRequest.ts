import { Document, Schema, Types, model } from 'mongoose'

export interface UserFeedbackRequestSchema {
  user: Types.ObjectId
  username?: string
  email?: string
  subject?: string
  category?: string
  message: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserFeedbackRequestDocument
  extends UserFeedbackRequestSchema,
    Document {}

const UserFeedbackRequestSchema = new Schema<UserFeedbackRequestDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      maxLength: 320,
    },
    subject: {
      type: String,
      maxLength: 200,
    },
    category: {
      type: String,
      maxLength: 120,
    },
    message: {
      type: String,
      required: true,
      maxLength: 5000,
    },
  },
  {
    timestamps: true,
  },
)

UserFeedbackRequestSchema.index({ user: 1, createdAt: -1 })

export const UserFeedbackRequest = model<UserFeedbackRequestDocument>(
  'userFeedbackRequest',
  UserFeedbackRequestSchema,
)
