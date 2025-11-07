'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { cn } from '@/lib/utils'
import { PropsWithChildren, useState } from 'react'

export default function ExploreLayout({ children }: PropsWithChildren) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex flex-col fixed inset-0">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 !overflow-y-hidden"
      >
        {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}
        <ResizablePanel
          defaultSize={20}
          minSize={isSidebarCollapsed ? 0 : 15}
          maxSize={30}
          collapsible={false}
          className={cn(
            'hidden md:flex md:flex-col bg-accent border-r transition-all duration-300 ease-in-out',
            isSidebarCollapsed
              ? 'min-w-[56px] max-w-[56px] w-[56px] p-1.5'
              : 'max-w-[320px] pl-3 pr-0 pt-0 pb-0',
          )}
        >
          {isSidebarCollapsed ? (
            <SessionsSidebarContent
              onSidebarToggle={() => setIsSidebarCollapsed(false)}
              isCollapsed={true}
            />
          ) : (
            <SessionsSidebarContent
              onSidebarToggle={() => setIsSidebarCollapsed(true)}
              mode="explore"
            />
          )}
        </ResizablePanel>

        {/* Separator Handle - hidden, keeping for resizing functionality */}
        <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

        {/* MAIN CONTENT PANEL */}
        <ResizablePanel
          defaultSize={80}
          className="relative flex flex-col bg-background -ml-px"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="mx-auto flex flex-col h-full w-full overflow-y-auto">
              {children}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
