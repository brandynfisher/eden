'use client'

import SidebarLayout from '@/components/layout/sidebar-layout'
import { ToolsSidebar } from '@/features/tools/tools-sidebar'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()

  // Only show sidebar on individual tool pages (e.g., /create/image/flux_dev)
  // but not on the main /create page
  const showSidebar = pathname !== '/create' && pathname.split('/').length > 2

  if (!showSidebar) {
    return <div className="p-4">{children}</div>
  }

  return (
    <SidebarLayout
      wrapClassName="!p-0 !justify-start !items-start"
      sidebar={<ToolsSidebar />}
    >
      {children}
    </SidebarLayout>
  )
}

export default PageLayout
