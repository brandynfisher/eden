export enum TriggerRepeatOptions {
  DOES_NOT_REPEAT = 'DOES_NOT_REPEAT',
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export const triggerRepeatOptions = [
  {
    name: 'Does not repeat',
    value: TriggerRepeatOptions.DOES_NOT_REPEAT,
  },
  {
    name: 'Every day',
    value: TriggerRepeatOptions.DAILY,
  },
  {
    name: 'Every weekday',
    value: TriggerRepeatOptions.WEEKDAYS,
  },
  {
    name: 'Every weekend',
    value: TriggerRepeatOptions.WEEKENDS,
  },
  {
    name: 'Every week',
    value: TriggerRepeatOptions.WEEKLY,
  },
  {
    name: 'Every month',
    value: TriggerRepeatOptions.MONTHLY,
  },
  {
    name: 'Every year',
    value: TriggerRepeatOptions.YEARLY,
  },
]
