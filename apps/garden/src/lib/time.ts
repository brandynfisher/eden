import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(relativeTime)

export const formatDuration = (duration: number) => {
  // convert number to x:xx format
  const minutes = Math.floor(duration / 60)
  const seconds = Math.ceil(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Returns relative time between the passed date and now
 */
export const timeAgo = (date: Date | string) => {
  return dayjs(date).utc().local().fromNow()
}

/**
 * Returns relative time difference between two passed dates
 */
export const durationBetweenDates = (
  startDate: string,
  endDate: string,
  hideSuffix?: boolean,
) => {
  const startDateObj = dayjs(startDate).utc()
  const endDateObj = dayjs(endDate).utc()
  return `${endDateObj.to(startDateObj, hideSuffix)}`
}
