'use client'

import Header from './header'
import { usePathname } from 'next/navigation'

const ConditionalHeader = () => {
  const pathname = usePathname()

  // Don't show the main header on these routes as they have their own specialized headers
  if (
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/sessions') ||
    pathname?.startsWith('/gigabrain') ||
    pathname?.startsWith('/explore') ||
    pathname?.startsWith('/create') ||
    pathname === '/'
  ) {
    return null
  }

  return <Header />
}

export default ConditionalHeader
