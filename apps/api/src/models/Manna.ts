import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { UserDocument } from './Creator'

export interface MannaSchema {
  user: UserDocument
  balance: number
  createdAt?: Date
  updatedAt?: Date
}

export interface MannaDocument extends MannaSchema, Document {}

const manna = new Schema<MannaDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

manna.pre<MannaDocument>('save', function (next) {
  this.updatedAt = new Date()

  next()
})

manna.plugin(paginate)

export const Manna = model<MannaDocument>('manna', manna)
