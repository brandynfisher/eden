import { CharacterDocument } from './Character'
import { UserDocument } from './User'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

export interface ApiKeySchema {
  user: UserDocument
  character?: CharacterDocument
  apiKey: string
  apiSecret?: string
  note?: string
  createdAt?: Date
  lastUsedAt?: Date
}

export interface ApiKeyInput {
  user: ObjectId
  apiKey: string
  apiSecret?: string
  note?: string
}

export interface ApiKeyDocument extends ApiKeySchema, SoftDeleteDocument {}

const apiKey = new Schema<ApiKeyDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    character: {
      type: Schema.Types.ObjectId,
      ref: 'characters',
    },
    apiKey: {
      type: String,
      required: true,
    },
    apiSecret: {
      type: String,
      required: false,
    },
    // Stamped on cache-miss authentication (so at most ~once per key per cache
    // TTL, not once per request). Without this there was no way to tell which
    // of ~570 keys are live, which made revoking or rotating them guesswork.
    lastUsedAt: {
      type: Date,
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

apiKey.plugin(paginate)

export const ApiKey = model<ApiKeyDocument>('apikeys', apiKey)
