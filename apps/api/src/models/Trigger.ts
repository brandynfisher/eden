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
  user: ObjectId
  session: ObjectId
  schedule: CronSchedule
  name: string
  prompt: string
  status?: 'active' | 'paused' | 'finished'
  deleted?: boolean
  last_run_time?: Date
  next_scheduled_run?: Date
}

export interface TriggerDocument extends TriggerSchema {}

const TriggerSchema = new Schema<TriggerDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'sessions_v2',
      required: true,
    },
    schedule: {
      type: Object,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'finished'],
      default: 'active',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    last_run_time: {
      type: Date,
      required: false,
    },
    next_scheduled_run: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

TriggerSchema.index({ session: 1 })
TriggerSchema.index({ user: 1 })

export const Trigger = model<TriggerDocument>('triggers2', TriggerSchema)
