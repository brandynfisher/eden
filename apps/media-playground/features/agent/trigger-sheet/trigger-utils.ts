import { z } from 'zod'

// Define the CronSchedule type based on the provided schema
export type CronSchedule = {
  year?: number | string
  month?: number | string
  day?: number | string
  week?: number | string
  day_of_week?: number | string | string[]
  hour?: number | string
  minute?: number | string
  second?: number | string
  start_date: Date
  end_date?: Date
  timezone?: string
}

export type Channel = {
  value: string
  label: string
}

export type Trigger = {
  id: string
  message: string
  schedule: CronSchedule
  channels: { id: string; name: string }[]
  createdAt?: Date
}

// Define form schema
export const formSchema = z.object({
  instructions: z.string().min(1, 'Instructions are required'),
  channels: z.array(z.string()),
  startDate: z.date(),
  repeat: z.enum([
    'DOES_NOT_REPEAT',
    'HOURLY',
    'DAILY',
    'WEEKDAYS',
    'WEEKENDS',
    'MONTHLY',
  ]),
  endDate: z.date().optional(),
  timezone: z.string(),
})

export type FormValues = z.infer<typeof formSchema>

// Define a type for the timezone object
export type TimezoneOption = {
  value: string
  label: string
  current: boolean
}

// Helper function to get all available timezones
export function getTimezones(): TimezoneOption[] {
  try {
    // Get the user's current timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Helper function to get GMT offset for a timezone
    const getGMTOffset = (timeZone: string): string => {
      try {
        // Get the offset in minutes
        const date = new Date()
        // Create formatter with 24h time to ensure consistent format
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone,
          timeStyle: 'medium',
          hour12: false,
        })

        // Create a date string like "00:00:00" for midnight UTC
        const utcDate = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0,
            0,
            0,
          ),
        )

        // Get the time in the target timezone
        const timeInZone = formatter.format(utcDate)
        const [hours] = timeInZone.split(':').map(Number)

        // Calculate offset - if local time is ahead of UTC, it's positive; otherwise, negative
        const offset = hours >= 12 ? hours - 24 : hours
        const sign = offset >= 0 ? '+' : ''

        return `GMT${sign}${offset}`
      } catch (e) {
        console.error(`Error getting offset for ${timeZone}:`, e)
        return ''
      }
    }

    // Format timezone with GMT offset
    const formatTimezone = (tz: string): TimezoneOption => {
      const gmtOffset = getGMTOffset(tz)
      const readableName = tz.replace(/_/g, ' ')
      return {
        value: tz,
        label: `${gmtOffset} ${readableName}`,
        current: tz === userTimezone,
      }
    }

    // Get list of timezones
    let timezones: string[] = []

    // This approach uses Intl.supportedValuesOf which is newer but more comprehensive
    // @ts-ignore - Intl.supportedValuesOf is not yet in TypeScript definitions
    if (typeof Intl.supportedValuesOf === 'function') {
      try {
        // @ts-ignore
        timezones = Intl.supportedValuesOf('timeZone')
      } catch (e) {
        console.error('Error getting timezones with Intl.supportedValuesOf:', e)
      }
    }

    // Fallback to a common list of major timezones
    if (timezones.length === 0) {
      timezones = [
        'America/Los_Angeles', // GMT-8
        'America/Denver', // GMT-7
        'America/Chicago', // GMT-6
        'America/New_York', // GMT-5
        'America/Sao_Paulo', // GMT-3
        'Europe/London', // GMT+0
        'Europe/Berlin', // GMT+1
        'Europe/Athens', // GMT+2
        'Europe/Moscow', // GMT+3
        'Asia/Dubai', // GMT+4
        'Asia/Kolkata', // GMT+5:30
        'Asia/Bangkok', // GMT+7
        'Asia/Shanghai', // GMT+8
        'Asia/Tokyo', // GMT+9
        'Australia/Sydney', // GMT+10
        'Pacific/Auckland', // GMT+12
      ]
    }

    // Map timezones to options with GMT offsets
    const options = timezones.map(tz => formatTimezone(tz))

    // Sort by GMT offset
    return options.sort((a, b) => {
      // Extract the numeric part of the GMT offset
      const getOffsetValue = (label: string) => {
        const match = label.match(/GMT([+-]\d+)/)
        return match ? parseInt(match[1]) : 0
      }

      const offsetA = getOffsetValue(a.label)
      const offsetB = getOffsetValue(b.label)

      return offsetA - offsetB
    })
  } catch (e) {
    console.error('Error getting timezones:', e)
    return []
  }
}

// Function to determine the repeat type from a schedule
export const determineRepeatType = (
  schedule: CronSchedule,
): FormValues['repeat'] => {
  if (schedule.hour !== undefined && schedule.minute !== undefined) {
    if (schedule.day_of_week === '1-5') {
      return 'WEEKDAYS'
    } else if (schedule.day_of_week === '0,6') {
      return 'WEEKENDS'
    } else if (schedule.day !== undefined) {
      return 'MONTHLY'
    } else if (
      schedule.day_of_week === undefined &&
      schedule.day === undefined
    ) {
      return 'DAILY'
    }
  } else if (schedule.minute === 0 && schedule.hour === undefined) {
    return 'HOURLY'
  }

  return 'DOES_NOT_REPEAT'
}

// This will be used to map the form values to the API schema
export const repeatValueToCronSchedule = (
  repeat: FormValues['repeat'],
  startDate: Date,
  endDate?: Date,
  timezone?: string,
): CronSchedule => {
  const cronSchedule: CronSchedule = {
    start_date: startDate,
    end_date: endDate,
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }

  switch (repeat) {
    case 'HOURLY':
      cronSchedule.minute = 0 // Every hour at minute 0
      break
    case 'DAILY':
      cronSchedule.hour = startDate.getHours()
      cronSchedule.minute = startDate.getMinutes()
      break
    case 'WEEKDAYS':
      cronSchedule.hour = startDate.getHours()
      cronSchedule.minute = startDate.getMinutes()
      cronSchedule.day_of_week = '1-5' // Monday to Friday
      break
    case 'WEEKENDS':
      cronSchedule.hour = startDate.getHours()
      cronSchedule.minute = startDate.getMinutes()
      cronSchedule.day_of_week = '0,6' // Sunday and Saturday
      break
    case 'MONTHLY':
      cronSchedule.hour = startDate.getHours()
      cronSchedule.minute = startDate.getMinutes()
      cronSchedule.day = startDate.getDate() // Same day of month
      break
    case 'DOES_NOT_REPEAT':
    default:
      // For non-recurring, we just use the start_date
      break
  }

  return cronSchedule
}
