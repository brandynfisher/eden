'use client'

import Header from './header'
import { useOptionalAppShell } from '@/components/layout/app-shell'
import { usePathname } from 'next/navigation'

const ConditionalHeader = () => {
  const pathname = usePathname()
  const appShell = useOptionalAppShell()

  // If the AppShell is active for this route, hide the legacy header entirely.
  if (appShell?.config.showShell) {
    return null
  }

  // Don't show the main header on these routes as they have their own specialized headers
  if (
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/sessions') ||
    pathname?.startsWith('/gigabrain') ||
    pathname?.startsWith('/explore') ||
    pathname?.startsWith('/create') ||
    pathname?.startsWith('/realtime') ||
    pathname?.startsWith('/agents') ||
    pathname?.startsWith('/tasks') ||
    pathname?.startsWith('/new') ||
    pathname?.startsWith('/train') ||
    pathname === '/'
  ) {
    return null
  }

  return <Header />
}

export default ConditionalHeader
