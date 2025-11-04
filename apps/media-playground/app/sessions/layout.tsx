'use client'

import SessionsHeader from '@/components/header/sessions-header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { SessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { cn } from '@/lib/utils'
import { useParams, usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useState } from 'react'

export default function SessionsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const params = useParams()
  const sessionId = params?.id as string | undefined
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [forceHideSidebar, setForceHideSidebar] = useState(false)

  // Hide sidebar on main sessions page
  const isShareRoute = pathname?.includes('/sessions/share/')
  const isMainSessionsPage = !sessionId
  const showSidebar = !isMainSessionsPage && !forceHideSidebar

  useEffect(() => {
    if (!showSidebar) {
      setIsSheetOpen(false)
    }
  }, [showSidebar])

  if (isShareRoute) {
    return (
      <LiveAudioProvider>
        {/* Sessions header for navigation */}
        <SessionsHeader
          onChatClick={() => {}} // No sidebar to open
          isSidebarCollapsed={false}
        />

        <div className="flex flex-col fixed inset-x-0 bottom-0 top-16 md:top-0">
          {/* Main content without sidebar */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto w-full max-w-4xl h-full">{children}</div>
          </div>
        </div>
      </LiveAudioProvider>
    )
  }

  const handleChatClick = () => {
    if (!showSidebar) {
      return
    }

    // Check if we're on mobile (window width < 768px for md breakpoint)
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Mobile: Open the slideout sidebar
      setIsSheetOpen(true)
    }
    // On desktop, do nothing as the sidebar is always visible or toggleable via resize
  }

  return (
    <SessionsLayoutContext.Provider
      value={{ forceHideSidebar, setForceHideSidebar }}
    >
      <LiveAudioProvider>
        {/* Sessions-specific header that replaces the main header */}
        <SessionsHeader
          onChatClick={handleChatClick}
          isSidebarCollapsed={isSidebarCollapsed || forceHideSidebar}
        />

        <div className="flex flex-col fixed inset-x-0 bottom-0 top-16 md:top-0">
          {/* MOBILE LEFT BAR SHEET FOR SESSIONS - only show when sidebar is enabled */}
          {showSidebar && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent
                side="left"
                className="flex flex-col max-h-full pt-3 px-3 pb-0 bg-accent border-r gap-0"
              >
                <SheetTitle className="sr-only">Sessions</SheetTitle>
                <SessionsSidebarContent />
              </SheetContent>
            </Sheet>
          )}

          {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}
          {showSidebar ? (
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 !overflow-y-hidden"
              autoSaveId="resizable-session-layout"
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
                  />
                )}
              </ResizablePanel>

              {/* Separator Handle - hidden, keeping for resizing functionality */}
              <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

              {/* MAIN CONTENT PANEL */}
              <ResizablePanel
                defaultSize={80}
                className="relative flex flex-col bg-aui-background -ml-px"
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="mx-auto flex flex-col h-full w-full overflow-hidden">
                    {children}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            /* Main sessions page without sidebar */
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="w-full h-full">{children}</div>
            </div>
          )}
        </div>
      </LiveAudioProvider>
    </SessionsLayoutContext.Provider>
  )
}
