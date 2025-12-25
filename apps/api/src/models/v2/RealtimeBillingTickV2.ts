import { ObjectId } from 'mongodb'
import { Document, Schema, model } from 'mongoose'

export interface RealtimeBillingTickSchema {
  realtimeSession: ObjectId
  transaction: ObjectId
  minuteNumber: number
  billedAt: Date
}

export interface RealtimeBillingTickInput {
  realtimeSession: ObjectId
  transaction: ObjectId
  minuteNumber: number
  billedAt?: Date
}

export interface RealtimeBillingTickDocument
  extends RealtimeBillingTickSchema,
    Document {}

const realtimeBillingTickSchema = new Schema<RealtimeBillingTickDocument>(
  {
    realtimeSession: {
      type: Schema.Types.ObjectId,
      ref: 'realtime_sessions',
      required: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'transactions',
      required: true,
    },
    minuteNumber: {
      type: Schema.Types.Number,
      required: true,
    },
    billedAt: {
      type: Schema.Types.Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    collection: 'realtime_billing_ticks',
  },
)

// Index for finding ticks by session
realtimeBillingTickSchema.index({ realtimeSession: 1, minuteNumber: 1 })

export const RealtimeBillingTick = model<RealtimeBillingTickDocument>(
  'realtime_billing_ticks',
  realtimeBillingTickSchema,
)
