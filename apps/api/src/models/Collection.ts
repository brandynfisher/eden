import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { enforceUserDocumentLimit } from '../lib/data'
import { CreationDocument } from './Creation'
import { UserDocument } from './Creator'

export interface CollectionSchema {
  user: UserDocument
  name: string
  description?: string
  creations: CreationDocument[]
  isDefaultCollection: boolean
  displayImageUri?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface CollectionInput {
  user: ObjectId
  name: string
  description?: string
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
      maxlength: 80,
    },
    description: {
      type: String,
      maxlength: 1000,
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
    displayImageUri: {
      type: String,
      maxLength: 1000,
    },
  },
  {
    timestamps: true,
  },
)
collection.pre<CollectionDocument>('update', function (next) {
  enforceUserDocumentLimit(25, 'collections', this.user)
  this.updatedAt = new Date()

  next()
})

collection.plugin(paginate)
collection.plugin(aggregatePaginate)

export const Collection = model<CollectionDocument>('collections', collection)
