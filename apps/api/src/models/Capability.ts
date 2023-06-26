import { ObjectId } from 'mongodb'
import mongoose, { Schema, model } from 'mongoose'
import { SoftDeleteDocument } from 'mongoose-delete'
import MongooseDelete from 'mongoose-delete'
import paginate from 'mongoose-paginate-v2'

import { CharacterDocument } from './Character'
import { UserDocument } from './Creator'

export enum CapabilityType {
  CHAT = 'chat',
}

export interface CapabilitySchema {
  user: UserDocument
  character: CharacterDocument
  type: CapabilityType
  data: any
  createdAt?: Date
  updatedAt?: Date
}

export interface CapabilityInput {
  creator: ObjectId
  character: ObjectId
  type: CapabilityType
  data: any
}

export interface CapabilityDocument
  extends CapabilitySchema,
    SoftDeleteDocument {}

const capability = new Schema<CapabilityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    character: {
      type: Schema.Types.ObjectId,
      ref: 'characters',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(CapabilityType),
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

capability.pre<CapabilityDocument>('save', async function (next) {
  const character = await mongoose.model('characters').findById(this.character)
  if (!character) {
    throw new Error('Agent not found.')
  }
  if (character) {
    const count = await mongoose.model('capabilities').countDocuments({
      character: character._id,
    })
    if (count >= 10) {
      throw new Error(
        'Maximum number of capabilities reached for this character.',
      )
    }
  }
  this.updatedAt = new Date()

  next()
})

capability.plugin(paginate)
capability.plugin(MongooseDelete, { deletedAt: true })

export const Capability = model<CapabilityDocument>('capabilities', capability)
