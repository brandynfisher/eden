import { CronSchedule } from '@edenlabs/eden-sdk'

export enum TriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// TODO-jmill:  please add the schedule for each option

export const triggerRepeatOptions: {
  name: string
  value: TriggerRepeatOptions
  schedule: CronSchedule
}[] = [
  {
    name: 'Does not repeat',
    value: TriggerRepeatOptions.DOES_NOT_REPEAT,
    schedule: {},
  },
  {
    name: 'Every day',
    value: TriggerRepeatOptions.DAILY,
    schedule: {},
  },
  {
    name: 'Every weekday',
    value: TriggerRepeatOptions.WEEKDAYS,
    schedule: {},
  },
  {
    name: 'Every weekend',
    value: TriggerRepeatOptions.WEEKENDS,
    schedule: {},
  },
  {
    name: 'Every week',
    value: TriggerRepeatOptions.WEEKLY,
    schedule: {},
  },
  {
    name: 'Every month',
    value: TriggerRepeatOptions.MONTHLY,
    schedule: {},
  },
  {
    name: 'Every year',
    value: TriggerRepeatOptions.YEARLY,
    schedule: {},
  },
]
