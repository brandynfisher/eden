import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// class merging method using twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Long = { low: number; high: number; unsigned: boolean }
export function toBigInt(longObj: Long): bigint {
  const MAX_UINT32 = BigInt('4294967296') // Now using a string
  const highPart = BigInt(longObj.high) * MAX_UINT32
  const lowPart = BigInt(longObj.low)
  return highPart + lowPart
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

export function formatTransactionDate(date: Date) {
  return new Date(date)
    .toLocaleString(undefined, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/,?\s+/g, ' ')
    .trim() // remove commas and normalize spaces
}
