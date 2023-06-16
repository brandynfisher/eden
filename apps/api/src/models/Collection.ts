import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'

export interface CollectionSchema {
  user: UserDocument
  name: string
  description?: string
  creations: CreationDocument[]
  isDefaultCollection: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CollectionDocument extends CollectionSchema, Document {}

const collection = new Schema<CollectionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    creations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'creations',
      },
    ],
    isDefaultCollection: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

collection.pre<CollectionDocument>('update', function (next) {
  this.updatedAt = new Date()

  next()
})

collection.plugin(paginate)

export const Collection = model<CollectionDocument>('collections', collection)
