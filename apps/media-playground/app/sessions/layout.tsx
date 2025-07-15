'use client'

import SessionsHeader from '@/components/header/sessions-header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { cn } from '@/lib/utils'
import { PropsWithChildren, useState } from 'react'

export default function SessionsLayout({ children }: PropsWithChildren) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleChatClick = () => {
    // Check if we're on mobile (window width < 768px for md breakpoint)
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Mobile: Open the slideout sidebar
      setIsSheetOpen(true)
    }
    // On desktop, do nothing as the sidebar is always visible or toggleable via resize
  }

  return (
    <LiveAudioProvider>
      {/* Sessions-specific header that replaces the main header */}
      <SessionsHeader
        onChatClick={handleChatClick}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
        {/* MOBILE LEFT BAR SHEET FOR SESSIONS */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="left"
            className="flex flex-col max-h-full pt-10 px-3 bg-accent border-r gap-0"
          >
            <SheetTitle className="sr-only">Session List</SheetTitle>
            <SessionsSidebarContent onItemClick={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 !overflow-y-hidden"
          autoSaveId="resizable-session-layout"
        >
          {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}

          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className={cn(
              'hidden md:flex md:flex-col bg-accent border-r p-3 pr-0 transition-all duration-300 ease-in-out',
              'max-w-[320px]',
              isSidebarCollapsed && 'p-0 border-none',
            )}
          >
            {/* Render content only if not collapsed */}
            {!isSidebarCollapsed && <SessionsSidebarContent />}
          </ResizablePanel>

          {/* Separator Handle - visible only on desktop */}
          <ResizableHandle
            withHandle
            className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
          />

          {/* MAIN CONTENT PANEL */}
          <ResizablePanel
            defaultSize={80}
            className="relative flex flex-col bg-aui-background"
          >
            <div className="flex flex-col overflow-y-auto h-full">
              <div className="mx-auto flex flex-col flex-1 w-full">
                {children}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </LiveAudioProvider>
  )
}
