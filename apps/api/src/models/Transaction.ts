import { MannaDocument } from './Manna'
import { TaskDocument } from './Task'
import { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import Stripe from 'stripe'

export type TransactionType =
  | 'spend'
  | 'credit_stripe'
  | 'credit_voucher'
  | 'admin_modify'

export interface TransactionSchema {
  manna: MannaDocument
  task?: TaskDocument
  amount: number
  type?: TransactionType
  stripeEventId?: string
  stripeEventType?: string
  stripeEventData?: Stripe.Event.Data
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
    type: {
      type: Schema.Types.String,
    },
    stripeEventId: {
      type: Schema.Types.String,
    },
    stripeEventType: {
      type: Schema.Types.String,
    },
    stripeEventData: {
      type: Schema.Types.Mixed,
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

transaction.index({ manna: 1, createdAt: -1 })
transaction.index({ type: -1 })
transaction.index(
  { stripeEventId: -1, stripeEventType: 1 },
  { unique: true, sparse: true },
)
transaction.plugin(paginate)

export const Transaction = model<TransactionDocument>(
  'transactions',
  transaction,
)
