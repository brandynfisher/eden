import { MediaAttributes, MediaType } from '@eden-labs/eden-sdk'
import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'
import { ReactionDocument } from './Reaction'
import { TaskDocument } from './Task'

export interface CreationSchema {
  user: UserDocument
  task: TaskDocument
  parent?: ObjectId
  delegateUser?: UserDocument
  delegateHasClaimed?: boolean
  uri: string
  thumbnail?: string
  media: string
  name: string
  attributes: any
  mediaAttributes: MediaAttributes
  reactions: ReactionDocument[]
  createdAt?: Date
  updatedAt?: Date
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
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'creations',
    },
    delegateUser: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    delegateHasClaimed: {
      type: Boolean,
      default: false,
    },
    uri: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    name: {
      type: String,
      required: true,
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

export const Creation = model<CreationDocument>('creations', creation)
