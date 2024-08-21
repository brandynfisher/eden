import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// class merging method using twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Long = { low: number; high: number; unsigned: boolean }

export function toBigInt(long: Long) {
  let high = long.unsigned ? long.high >>> 0 : long.high
  return BigInt(high) << (BigInt(32) + BigInt(long.low >>> 0))
}
