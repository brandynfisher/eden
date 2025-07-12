'use client'

import Header from './header'
import { usePathname } from 'next/navigation'

const ConditionalHeader = () => {
  const pathname = usePathname()

  // Don't show the main header on these routes as they have their own specialized headers
  if (
    pathname?.startsWith('/chat2') ||
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/sessions')
  ) {
    return null
  }

  return <Header />
}

export default ConditionalHeader
