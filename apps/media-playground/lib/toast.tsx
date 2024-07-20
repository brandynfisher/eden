import { cn } from '@/lib/utils'
import { ReactElement } from 'react'

const variantClassMap = {
  error: 'text-red-600',
  success: 'text-green-600',
  info: 'text-blue-600',
}

export function getToastConfig(
  title: string,
  description: string | ReactElement,
  variant: 'success' | 'error' | 'info' = 'info',
) {
  return {
    className: cn([
      'flex p-4',
      variantClassMap[variant], // just access the respective class
    ]),
    title: title,
    description: <div className="text-primary">{description}</div>,
  }
}
