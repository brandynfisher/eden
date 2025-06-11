import { Creator } from 'src/models'
import { Agent } from 'src/models/v2'

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

export type Trigger = {
  _id: string
  trigger_id: string
  user: Creator
  agent: Agent
  session?: string | null
  schedule: CronSchedule
  instruction: string
  update_config?: any
  status?: 'active' | 'paused' | 'finished'
  createdAt: Date
  updatedAt: Date
}
