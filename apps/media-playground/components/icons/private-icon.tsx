import { cn } from '@/lib/utils'
import { LockIcon } from 'lucide-react'
import React from 'react'

type Props = {
  className?: string
}

const PrivateIcon = ({ className }: Props) => {
  return (
    <LockIcon
      className={cn([
        'absolute h-6 w-6 left-2 top-2 text-red-500 bg-accent/50 rounded-sm p-1 z-20',
        className,
      ])}
    />
  )
}

export default PrivateIcon
