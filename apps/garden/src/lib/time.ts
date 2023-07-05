import dayjs, { QUnitType } from 'dayjs'
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

export const durationSinceDate = (date: string) => {
  return dayjs(date).utc().local().fromNow()
}

export const durationBetweenDates = (
  startDate: string,
  endDate: string,
  unit: QUnitType,
  appendUnit: boolean,
) => {
  const startDateObj = dayjs(startDate).utc()
  const endDateObj = dayjs(endDate).utc()
  return `${endDateObj.diff(startDateObj, unit)} ${
    appendUnit ? unit : ''
  }`.trim()
}
