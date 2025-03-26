import { Creator } from 'src/models'
import { Agent, Thread } from 'src/models/v2'

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
  agent: Agent
  user: Creator
  thread: Thread
  schedule: CronSchedule
  platform: string
  channel: {
    id: string
    note?: string
  }
  message: string
  createdAt: Date
  updatedAt: Date
}
