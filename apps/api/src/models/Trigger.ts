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

export interface TriggerRun {
  message_id: ObjectId
  ran_at: Date
}

export type SessionTarget = 'new' | 'discord_dm' | 'existing'

export interface TriggerSchema {
  user: ObjectId
  session?: ObjectId | null // Optional - null when "Create new session" is selected
  agent?: ObjectId | null // Agent reference - required when session is null
  session_target?: SessionTarget // Determines how session is resolved: 'new' creates app session, 'discord_dm' uses Discord DM, 'existing' uses session field
  schedule?: CronSchedule // Optional - tasks without schedules run manually only
  name: string
  prompt: string
  status?: 'active' | 'paused' | 'finished' | 'running'
  deleted?: boolean
  last_run_time?: Date
  next_scheduled_run?: Date
  error_count?: number
  last_error?: string
  runs?: TriggerRun[] // Track each run with message_id and timestamp
  subscribable?: boolean // Whether this trigger can be subscribed to by others
  parent_trigger?: ObjectId | null // Reference to the parent trigger (if this is a subscription)
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
      ref: 'sessions',
      required: false, // Optional - null when "Create new session" is selected
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'agent',
      required: false, // Required when session is null
    },
    session_target: {
      type: String,
      enum: ['new', 'discord_dm', 'existing'],
      required: false,
    },
    schedule: {
      type: Object,
      required: false, // Optional - tasks without schedules run manually only
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
      enum: ['active', 'paused', 'finished', 'running'],
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
    error_count: {
      type: Number,
      default: 0,
    },
    last_error: {
      type: String,
      required: false,
    },
    runs: {
      type: [
        {
          message_id: {
            type: Schema.Types.ObjectId,
            ref: 'messages',
            required: true,
          },
          ran_at: { type: Date, required: true },
        },
      ],
      default: [],
    },
    subscribable: {
      type: Boolean,
      default: false,
    },
    parent_trigger: {
      type: Schema.Types.ObjectId,
      ref: 'triggers2',
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

TriggerSchema.index({ session: 1 })
TriggerSchema.index({ user: 1 })
TriggerSchema.index({ agent: 1 })
TriggerSchema.index({ parent_trigger: 1 })
TriggerSchema.index({ subscribable: 1, agent: 1 }) // For finding subscribable triggers by agent

export const Trigger = model<TriggerDocument>('triggers2', TriggerSchema)
