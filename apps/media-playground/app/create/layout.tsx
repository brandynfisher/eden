'use client'

import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()

  // Main /create page gets padding, tool pages get no padding
  const isMainPage = pathname === '/create'

  if (isMainPage) {
    return <div className="p-4">{children}</div>
  }

  return <div>{children}</div>
}

export default PageLayout
