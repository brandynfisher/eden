import { ObjectId } from 'mongodb'
import { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import MongooseDelete from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { CapabilityDocument } from './Capability'
import { UserDocument } from './Creator'

export interface CharacterSchema {
  user: UserDocument
  name: string
  capabilities: CapabilityDocument[]
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CharacterInput {
  user: ObjectId
  name: string
  description?: string
}

export interface CharacterDocument
  extends CharacterSchema,
    SoftDeleteDocument {}

const character = new Schema<CharacterDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 80,
    },
    capabilities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'capabilities',
      },
    ],
    description: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
)

character.pre<CharacterDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

character.index({ user: 1, name: 1 }, { unique: true })

character.plugin(paginate)
character.plugin(MongooseDelete, { deletedAt: true })

export const Character = model<CharacterDocument>('characters', character)
