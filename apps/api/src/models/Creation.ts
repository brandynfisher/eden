import { MediaAttributes, MediaType } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete from 'mongoose-delete'
import { SoftDeleteDocument } from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { VisibilitySchema } from '../types/baseSchemas'
import { UserDocument } from './Creator'
import { TaskDocument } from './Task'

export interface CreationSchema extends VisibilitySchema {
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
  embedding?: {
    embedding?: number[]
    score?: number
  }
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
    width?: number
    height?: number
    aspectRatio?: number
  }
}

export interface CreationDocument extends SoftDeleteDocument, CreationSchema {}

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
      maxlength: 10000,
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
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      aspectRatio: {
        type: Number,
      },
    },
    embedding: {
      embedding: {
        type: [Number],
      },
      score: {
        type: Number,
      },
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deleteBy: {
      type: String,
    },
    private: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

creation.pre<CreationDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

creation.index({ createdAt: 1 })
creation.index({ user: 1 })

creation.plugin(mongooseDelete, { overrideMethods: 'all' })

creation.plugin(paginate)
creation.plugin(aggregatePaginate)

export const Creation = model<CreationDocument>('creations', creation)
