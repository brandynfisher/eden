import { CronSchedule } from '../models/Trigger'
import { CronExpressionOptions, CronExpressionParser } from 'cron-parser'

/**
 * Calculate the next scheduled run time from a CronSchedule.
 * Returns null if the schedule has no valid next run (e.g., end_date has passed).
 */
export function calculateNextScheduledRun(schedule: CronSchedule): Date | null {
  try {
    // Handle one-time schedules (start_date equals end_date)
    // For these, we just return the start_date directly instead of using cron parsing
    if (schedule.start_date && schedule.end_date) {
      const startDate = new Date(schedule.start_date)
      const endDate = new Date(schedule.end_date)

      // If start and end are the same (or very close), it's a one-time task
      if (Math.abs(startDate.getTime() - endDate.getTime()) < 1000) {
        // Return the scheduled time if it's in the future
        if (startDate > new Date()) {
          return startDate
        }
        // One-time task that's already passed
        return null
      }
    }

    // Build cron expression from schedule fields
    // Format: minute hour dayOfMonth month dayOfWeek
    const minute = schedule.minute ?? '*'
    const hour = schedule.hour ?? '*'
    const dayOfMonth = schedule.day ?? '*'
    const month = schedule.month ?? '*'
    const dayOfWeek = schedule.day_of_week ?? '*'

    const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`

    const options: CronExpressionOptions = {
      currentDate: schedule.start_date
        ? new Date(schedule.start_date)
        : new Date(),
      tz: schedule.timezone || 'UTC',
    }

    // Add end date if specified
    if (schedule.end_date) {
      options.endDate = new Date(schedule.end_date)
    }

    const expression = CronExpressionParser.parse(cronExpression, options)

    // Get the next occurrence
    const next = expression.next()
    return next.toDate()
  } catch {
    // This can happen if:
    // - The cron expression is invalid
    // - The end_date has passed and there's no next occurrence
    // - Other parsing errors
    return null
  }
}
