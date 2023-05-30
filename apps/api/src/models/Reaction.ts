import { Document, Schema, model } from 'mongoose'

import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'

export interface ReactionSchema {
  user: UserDocument
  creation: CreationDocument
  reaction: string
  createdAt?: Date
  updatedAt?: Date | number
}

export interface ReactionDocument extends ReactionSchema, Document {}

const reactions = new Schema<ReactionDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  creation: {
    type: Schema.Types.ObjectId,
    ref: 'creations',
    required: true,
  },
  reaction: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

reactions.pre<ReactionDocument>('update', function (next) {
  this.updatedAt = Date.now()

  next()
})

export const Reaction = model<ReactionDocument>('reactions', reactions)
