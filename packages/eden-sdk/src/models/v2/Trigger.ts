import { Creator } from '../Creators'

export type CronSchedule = {
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

export type TriggerRun = {
  message_id: string
  ran_at: Date
}

export type TriggerSessionAgent = {
  _id: string
  username: string
  name?: string
  userImage?: string
}

export type TriggerSession = {
  _id: string
  title?: string
  agents?: TriggerSessionAgent[]
}

export type TriggerAgent = {
  _id: string
  username: string
  name?: string
  userImage?: string
}

export type Trigger = {
  _id: string
  user: Creator
  session?: string | TriggerSession | null // Optional - null when "Create new session" is selected
  agent?: string | TriggerAgent | null // Agent reference - required when session is null
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
  createdAt: Date
  updatedAt: Date
}
