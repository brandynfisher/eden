import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export interface ApiKeySchema {
  user: UserDocument
  apiKey: string
  apiSecret: string
  note?: string
  deleted?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface ApiKeyInput {
  user: ObjectId
  apiKey: string
  apiSecret: string
  note?: string
}

export interface ApiKeyDocument extends ApiKeySchema, Document {}

const apiKey = new Schema<ApiKeyDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
    },
    apiSecret: {
      type: String,
      required: true,
    },
    note: {
      type: String,
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

apiKey.pre<ApiKeyDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

apiKey.plugin(paginate)

export const ApiKey = model<ApiKeyDocument>('apikey', apiKey)
