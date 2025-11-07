'use client'

import { PropsWithChildren } from 'react'

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col fixed inset-0">
      <div className="flex-1 overflow-y-auto bg-background">{children}</div>
    </div>
  )
}
