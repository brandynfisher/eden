import { MediaType } from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'
import { TaskDocument } from './Task'

export interface ConceptSchema {
  user: UserDocument
  task: TaskDocument
  praiseCount: number
  bookmarkCount: number
  delegate?: UserDocument
  uri: string
  thumbnail?: string
  name: string
  conceptName: string
  checkpoint: string
  training_images: string[]
  attributes?: any
  createdAt?: Date
  updatedAt?: Date
}

export interface ConceptInput {
  user: ObjectId
  task: ObjectId
  delegate?: ObjectId
  uri: string
  thumbnail?: string
  name: string
  conceptName: string
  checkpoint: string
  training_images: string[]
  attributes?: Record<string, any>
  mediaAttributes?: {
    type: MediaType
    duration?: number
  }
}

export interface ConceptDocument extends ConceptSchema, Document {}

const concept = new Schema<ConceptDocument>(
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
    conceptName: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    checkpoint: {
      type: String,
      required: true,
    },
    training_images: {
      type: [String],
      required: true,
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

concept.pre<ConceptDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

concept.index({ createdAt: 1 })

concept.plugin(paginate)
concept.plugin(aggregatePaginate)

export const Concept = model<ConceptDocument>('concepts', concept)
