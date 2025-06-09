import { ObjectId, Schema, model } from 'mongoose'

export interface CronSchedule {
  year?: number | string
  month?: number | string
  day?: number | string
  week?: number | string
  day_of_week?: number | string
  hour?: number | string
  minute?: number | string
  second?: number | string
  start_date?: Date
  end_date?: Date
  timezone?: string
}

export interface TriggerSchema {
  agent: ObjectId
  user: ObjectId
  thread: ObjectId
  schedule: CronSchedule
  deployment: ObjectId
  message: string
  channel_id: string
  status?: 'active' | 'paused' | 'finished'
}

export interface TriggerDocument extends TriggerSchema {}

const TriggerSchema = new Schema<TriggerDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    deployment: {
      type: Schema.Types.ObjectId,
      ref: 'deployments',
      required: true,
    },
    schedule: {
      type: Object,
      required: true,
    },
    thread: {
      type: Schema.Types.ObjectId,
      ref: 'threads',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    channel_id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'finished'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
)

TriggerSchema.index({ agent: 1 })

export const Trigger = model<TriggerDocument>('triggers', TriggerSchema)
