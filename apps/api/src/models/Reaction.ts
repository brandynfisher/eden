import { ReactionType } from '@eden-labs/eden-sdk'
import { Document, Schema, model } from 'mongoose'

import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'

export interface ReactionSchema {
  user: UserDocument
  creation: CreationDocument
  reaction: ReactionType
  createdAt?: Date
}

export interface ReactionDocument extends ReactionSchema, Document {}

const reaction = new Schema<ReactionDocument>(
  {
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
  },
  {
    timestamps: true,
  },
)

reaction.index({ user: 1, creation: 1 }, { unique: true })

export const Reaction = model<ReactionDocument>('reactions', reaction)
