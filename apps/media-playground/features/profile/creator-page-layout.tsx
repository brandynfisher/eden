'use client'

import { useAppShell } from '@/components/layout/app-shell'
import { MenuIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'

export default function CreatorPageLayout({ children }: PropsWithChildren) {
  const { openMobileSidebar } = useAppShell()

  return (
    <div className="flex flex-col min-h-0">
      {/* Mobile navbar - sticky */}
      <div className="md:hidden sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-2 shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      {/* Page content */}
      {children}
    </div>
  )
}
