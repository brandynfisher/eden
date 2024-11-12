import { UserDocument } from '../Creator'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export type MessageSchema = {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content?: string
  tool_results?: {
    id: string
    name: string
    result: string
    error?: string
  }[]
  metadata?: {
    [key: string]: string | number | boolean | Date | null
  }
  attachments?: string[]
  createdAt: Date
}

export interface ThreadSchema {
  user: UserDocument
  name: string
  messages: MessageSchema[]
  createdAt: Date
  updatedAt: Date
}

export interface ThreadInput {
  user: ObjectId
}

export interface ThreadDocument extends ThreadSchema, SoftDeleteDocument {}

export const threadSchema = new Schema<ThreadDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    messages: {
      type: [Schema.Types.Mixed],
      required: false,
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

threadSchema.index({ createdAt: -1 })
threadSchema.index({
  user: 1,
  createdAt: -1,
})
threadSchema.plugin(paginate)
threadSchema.plugin(aggregatePaginate)
threadSchema.plugin(mongooseDelete, {
  overrideMethods: ['find', 'findOne', 'countDocuments', 'count'],
})

export const Thread = model<ThreadDocument>(
  'threads',
  threadSchema,
) as SoftDeleteModel<ThreadDocument>
