import {
  CreationAttributes,
  MediaAttributes,
  MediaType,
} from '@edenlabs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import mongooseDelete, {
  SoftDeleteDocument,
  SoftDeleteModel,
} from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { VisibilitySchema } from '../types/baseSchemas'
import { CharacterDocument } from './Character'
import { ConceptDocument } from './Concept'
import { UserDocument } from './Creator'
import { GeneratorDocument } from './Generator'
import { TaskDocument } from './Task'

export interface CreationSchema extends VisibilitySchema {
  user: UserDocument
  character?: CharacterDocument
  task: TaskDocument
  concept?: ConceptDocument
  generator?: GeneratorDocument
  praiseCount: number
  bookmarkCount: number
  delegate?: UserDocument
  uri?: string
  thumbnail?: string
  name?: string
  attributes?: CreationAttributes
  mediaAttributes: MediaAttributes
  embedding?: {
    embedding?: number[]
    score?: number
  }
  createdAt?: Date
  updatedAt?: Date
  samples?: CreationDocument[]
}

export interface CreationInput {
  _id?: ObjectId
  user: ObjectId | UserDocument
  character?: ObjectId | CharacterDocument
  task: ObjectId
  concept?: ObjectId | ConceptDocument
  generator?: ObjectId | GeneratorDocument
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
  isPrivate?: boolean
  samples?: ObjectId[]
}

export interface CreationDocument extends SoftDeleteDocument, CreationSchema {}

const creation = new Schema<CreationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    character: {
      type: Schema.Types.ObjectId,
      ref: 'characters',
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'tasks',
      required: true,
    },
    generator: {
      type: Schema.Types.ObjectId,
      ref: 'generators',
      required: false,
    },
    concept: {
      type: Schema.Types.ObjectId,
      ref: 'concepts',
      required: false,
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
    samples: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'creations',
          required: true,
        },
      ],
      required: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deleteBy: {
      type: String,
    },
    isPrivate: {
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

creation.index({ concept: -1 })
creation.index({ createdAt: 1 })
creation.index({ user: 1, deleted: 1, isPrivate: 1 })
creation.index({ deleted: 1, isPrivate: 1 })
creation.index({ praiseCount: -1, bookmarkCount: -1, createdAt: -1, _id: -1 })
creation.index({ createdAt: -1, _id: -1, 'embedding.score': -1 })
creation.index({ 'embedding.score': -1 })

creation.plugin(mongooseDelete, { overrideMethods: 'all' })
creation.plugin(paginate)
creation.plugin(aggregatePaginate)

export const Creation = model<CreationDocument>(
  'creations',
  creation,
) as SoftDeleteModel<CreationDocument>
