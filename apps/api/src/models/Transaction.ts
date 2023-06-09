import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { MannaDocument } from './Manna'
import { TaskDocument } from './Task'

export interface TransactionSchema {
  manna: MannaDocument
  task?: TaskDocument
  amount: number
  createdAt?: Date
}

export interface TransactionDocument extends TransactionSchema, Document {}

const transaction = new Schema<TransactionDocument>(
  {
    manna: {
      type: Schema.Types.ObjectId,
      ref: 'manna',
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'tasks',
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

transaction.plugin(paginate)

export const Transaction = model<TransactionDocument>(
  'transactions',
  transaction,
)
