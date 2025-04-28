import { CronSchedule } from '@edenlabs/eden-sdk'

export enum TriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  DAILY = 'daily',
}

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
]
