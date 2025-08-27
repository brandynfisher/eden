import cronstrue from 'cronstrue'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

type CronSchedule = {
  year?: number | string
  month?: number | string
  day?: number | string
  week?: number | string
  day_of_week?: number | string | string[]
  hour?: number | string
  minute?: number | string
  second?: number | string
  start_date?: Date
  end_date?: Date
  timezone?: string
}

function scheduleToCronExpression(schedule: CronSchedule): string {
  // Convert day_of_week to cron format
  let dayOfWeek = '*'
  if (schedule.day_of_week) {
    if (Array.isArray(schedule.day_of_week)) {
      dayOfWeek = schedule.day_of_week
        .map(day => {
          if (typeof day === 'string') {
            const dayMap: Record<string, string> = {
              sun: '0',
              mon: '1',
              tue: '2',
              wed: '3',
              thu: '4',
              fri: '5',
              sat: '6',
            }
            return dayMap[day.toLowerCase()]
          }
          return day
        })
        .join(',')
    } else {
      dayOfWeek =
        typeof schedule.day_of_week === 'string'
          ? schedule.day_of_week
          : schedule.day_of_week.toString()
    }
  }

  // Convert month to cron format
  const month = schedule.month || '*'

  // Convert day to cron format
  const day = schedule.day || '*'

  // Convert hour to cron format
  const hour = schedule.hour || '0'

  // Convert minute to cron format
  const minute = schedule.minute || '0'

  return `${minute} ${hour} ${day} ${month} ${dayOfWeek}`
}

export function formatCronSchedule(schedule: CronSchedule): string {
  const parts: string[] = []

  // Handle one-time tasks (where start_date equals end_date)
  if (
    schedule.start_date &&
    schedule.end_date &&
    dayjs(schedule.start_date).isSame(dayjs(schedule.end_date))
  ) {
    const taskDate = dayjs(schedule.start_date).tz(schedule.timezone || 'UTC')
    const now = dayjs().tz(schedule.timezone || 'UTC')
    const hour = schedule.hour?.toString() || taskDate.format('H')
    const minute = schedule.minute?.toString() || taskDate.format('m')
    const formattedTime = dayjs()
      .hour(parseInt(hour, 10))
      .minute(parseInt(minute, 10))
      .format('h:mma')
      .toLowerCase()

    if (taskDate.isSame(now, 'day')) {
      return `at ${formattedTime}`
    } else {
      return `at ${formattedTime}, ${taskDate.format('MMMM D, YYYY')}`
    }
  }

  // Get the cron expression
  const cronExpression = scheduleToCronExpression(schedule)

  try {
    // Get the human-readable description
    const description = cronstrue.toString(cronExpression, {
      verbose: true,
      throwExceptionOnParseError: false,
    })
    parts.push(description)
  } catch (_error) {
    // Fallback to basic formatting if cronstrue fails
    const hour = schedule.hour?.toString().padStart(2, '0') || '00'
    const minute = schedule.minute?.toString().padStart(2, '0') || '00'
    const timezone = schedule.timezone || 'UTC'
    const timezoneAbbr = dayjs().tz(timezone).format('z')
    parts.push(`${hour}:${minute} ${timezoneAbbr}`)
  }

  // Add end date if specified
  if (schedule.end_date) {
    const endDate = dayjs(schedule.end_date).tz(schedule.timezone || 'UTC')
    parts.push(`until ${endDate.format('MMMM D, YYYY')}`)
  }

  return parts.join(', ')
}
