'use client'

import ExploreHeader from './explore-header'
import Header from './header'
import HomeHeader from './home-header'
import { usePathname } from 'next/navigation'

const ConditionalHeader = () => {
  const pathname = usePathname()

  // Don't show the main header on these routes as they have their own specialized headers
  if (
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/sessions') ||
    pathname?.startsWith('/gigabrain')
  ) {
    return null
  }

  // Use home header for the main page
  if (pathname === '/') {
    return <HomeHeader />
  }

  // Use explore header for /explore and /create routes
  if (pathname?.startsWith('/explore') || pathname?.startsWith('/create')) {
    return <ExploreHeader />
  }

  return <Header />
}

export default ConditionalHeader
