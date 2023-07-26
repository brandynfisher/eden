import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'
import { TaskDocument } from './Task'

export interface CreationSchema {
  user: UserDocument
  task: TaskDocument
  praiseCount: number
  bookmarkCount: number
  delegate?: UserDocument
  uri?: string
  thumbnail?: string
  name?: string
  attributes?: any
  mediaAttributes: MediaAttributes
  similarCreations?: CreationDocument[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CreationInput {
  user: ObjectId
  task: ObjectId
  delegate?: ObjectId
  uri?: string
  thumbnail?: string
  name?: string
  attributes?: Record<string, any>
  mediaAttributes?: {
    type: MediaType
    duration?: number
  }
}

export interface CreationDocument extends CreationSchema, Document {}

const creation = new Schema<CreationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'tasks',
      required: true,
    },
    praiseCount: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    delegate: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    uri: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    thumbnail: {
      type: String,
      maxlength: 1000,
    },
    name: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    mediaAttributes: {
      type: {
        type: String,
        enum: Object.values(MediaType),
        required: true,
      },
      duration: {
        type: Number,
      },
    },
    similarCreations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'creations',
      },
    ],
  },
  {
    timestamps: true,
  },
)

creation.pre<CreationDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

creation.plugin(paginate)
creation.plugin(aggregatePaginate)

export const Creation = model<CreationDocument>('creations', creation)
