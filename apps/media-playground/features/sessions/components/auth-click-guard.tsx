'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import React, { PropsWithChildren } from 'react'
import { toast } from 'sonner'

export const AuthClickGuard = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  const { verifyAuth } = useAuthState()
  return (
    <div
      onClickCapture={async e => {
        if (!(await verifyAuth())) {
          e.preventDefault()
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
          toast.error('You must be logged in to perform this action!')
        }
      }}
      className={className}
    >
      {children}
    </div>
  )
}
