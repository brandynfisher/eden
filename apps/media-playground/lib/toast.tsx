import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export function getToastConfig(
  title: string,
  description: string | ReactNode,
  variant: 'success' | 'error' | 'info' = 'info',
) {
  return {
    className: cn([
      'flex p-4',
      variant === 'error' ? 'text-red-600' : '',
      variant === 'success' ? 'text-green-600' : '',
      variant === 'info' ? 'text-blue-600' : '',
    ]),
    title: title,
    description: <div className="text-primary">{description}</div>,
  }
}
