import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// class merging method using twMerge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
