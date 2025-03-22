import { z } from 'zod'

export const RecurrenceTypes = {
  DOES_NOT_REPEAT: 'DOES_NOT_REPEAT',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  ANNUALLY: 'ANNUALLY',
  WEEKDAYS: 'WEEKDAYS',
  CUSTOM: 'CUSTOM',
} as const

export type RecurrenceType =
  (typeof RecurrenceTypes)[keyof typeof RecurrenceTypes]

export const triggerFormSchema = z.object({
  channelId: z.string().min(1, 'Please select a channel'),
  date: z.date(),
  time: z.string().min(1, 'Please select a time'),
  recurrenceType: z.nativeEnum(RecurrenceTypes),
  // For custom recurrence
  customDays: z.array(z.string()).optional(),
  // Optional end date for recurring events
  endDate: z.date().optional(),
  timezone: z.string().default('UTC'),
  instructions: z.string().min(1, 'Please enter instructions'),
})

export type TriggerFormData = z.infer<typeof triggerFormSchema>

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export interface Trigger {
  id: string
  channelId: string
  schedule: {
    time: string
    days: string[]
    timezone: string
  }
  instructions: string
  isActive: boolean
}

export interface TriggerSectionProps {
  agentId: string
  triggers: Trigger[]
}
