import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import MongooseDelete from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export interface ApiKeySchema {
  user: UserDocument
  apiKey: string
  apiSecret: string
  note?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ApiKeyInput {
  user: ObjectId
  apiKey: string
  apiSecret: string
  note?: string
}

export interface ApiKeyDocument extends ApiKeySchema, SoftDeleteDocument {}

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
apiKey.plugin(MongooseDelete, { deletedAt: true })

export const ApiKey = model<ApiKeyDocument>('apikey', apiKey)
