import { Deployment } from '@edenlabs/eden-sdk'

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

export function getChannelsForPlatform(
  platform: string,
  deployment: Deployment,
) {
  if (platform === 'discord') return deployment.config.discord.channel_allowlist
  if (platform === 'telegram') return deployment.config.telegram.topic_allowlist

  return []
}
