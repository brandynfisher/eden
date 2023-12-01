import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { enforceUserDocumentLimit } from '../lib/data'
import { CharacterDocument } from './Character'
import { UserDocument } from './Creator'

export interface ApiKeySchema {
  user: UserDocument
  character?: CharacterDocument
  apiKey: string
  apiSecret: string
  note?: string
  createdAt?: Date
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
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
)

apiKey.pre<ApiKeyDocument>('save', function (next) {
  enforceUserDocumentLimit(10, 'apikeys', this.user)

  next()
})

apiKey.plugin(paginate)

export const ApiKey = model<ApiKeyDocument>('apikeys', apiKey)
