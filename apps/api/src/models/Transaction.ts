import { MannaDocument } from './Manna'
import { TaskDocument } from './Task'
import { MannaVoucherDocument } from './v3/MannaVoucher'
import { TransactionType } from '@edenlabs/eden-sdk'
import mongoose, { Document, Schema, model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import Stripe from 'stripe'

export interface TransactionSchema {
  manna: MannaDocument
  amount: number
  type?: TransactionType
  task?: TaskDocument
  voucher?: MannaVoucherDocument
  code?: string
  stripeEventId?: string
  stripeEventType?: string
  // Links a credit to the Stripe payment that funded it, so a later refund or
  // dispute can claw back exactly that credit instead of guessing an amount.
  stripePaymentIntentId?: string
  stripeEventData?: Stripe.Event.Data
  // Attribution for admin_modify grants: the admin user + API key that made
  // the call, and a source tag (e.g. 'stripe_topup' vs 'manual').
  initiatedBy?: Schema.Types.ObjectId
  initiatedByApiKey?: Schema.Types.ObjectId
  source?: string
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
    voucher: {
      type: Schema.Types.ObjectId,
      ref: 'mannavouchers',
    },
    code: {
      type: Schema.Types.String,
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
    stripePaymentIntentId: {
      type: Schema.Types.String,
    },
    amount: {
      type: Number,
      required: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    initiatedByApiKey: {
      type: Schema.Types.ObjectId,
      ref: 'apikeys',
    },
    source: {
      type: Schema.Types.String,
    },
  },
  {
    timestamps: true,
  },
)

transaction.index({ stripePaymentIntentId: 1 }, { sparse: true })
transaction.index({ manna: 1, createdAt: -1 })
transaction.index({ type: -1 })
transaction.index(
  { stripeEventId: -1, stripeEventType: 1 },
  { unique: true, sparse: true },
)
transaction.plugin(paginate)

export const Transaction =
  (mongoose.models.transactions as mongoose.Model<TransactionDocument>) ||
  model<TransactionDocument>('transactions', transaction)
