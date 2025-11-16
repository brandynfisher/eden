'use client'

import SessionsHeader from '@/components/header/sessions-header'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollContainerProvider } from '@/contexts/scroll-container-context'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { SessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { cn } from '@/lib/utils'
import { EditIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

export default function SessionsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [forceHideSidebar, setForceHideSidebar] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Hide sidebar on share routes only
  const isShareRoute = pathname?.includes('/sessions/share/')
  const showSidebar = !isShareRoute && !forceHideSidebar

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
          <ScrollContainerProvider value={scrollRef}>
            <div
              className="flex-1 overflow-y-auto bg-background"
              ref={scrollRef}
            >
              <div className="mx-auto w-full max-w-4xl h-full">{children}</div>
            </div>
          </ScrollContainerProvider>
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
                className="flex flex-col max-h-full pt-0 pl-0 pr-0 pb-0 bg-accent border-r gap-0 [&>button]:hidden"
              >
                <SheetTitle className="sr-only">Sessions</SheetTitle>
                {/* Mobile sticky header with logo and new session button */}
                <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => {
                      setIsSheetOpen(false)
                      router.push('/')
                    }}
                    className="flex items-center gap-2"
                  >
                    <EdenLogoBw className="w-[28px]" />
                  </button>
                  <button
                    onClick={() => {
                      setIsSheetOpen(false)
                      router.push('/sessions/new')
                    }}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    aria-label="New Session"
                  >
                    <EditIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {/* Scrollable sidebar content */}
                <div className="flex-1 overflow-y-auto pl-3">
                  <SessionsSidebarContent
                    onItemClick={() => setIsSheetOpen(false)}
                    isMobileSidebar={true}
                  />
                </div>
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
                <ScrollContainerProvider value={scrollRef}>
                  <div className="flex flex-col h-full overflow-hidden">
                    <div
                      ref={scrollRef}
                      className="mx-auto flex flex-col h-full w-full overflow-y-auto"
                    >
                      {children}
                    </div>
                  </div>
                </ScrollContainerProvider>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            /* Main sessions page without sidebar */
            <ScrollContainerProvider value={scrollRef}>
              <div
                className="flex-1 overflow-y-auto bg-background"
                ref={scrollRef}
              >
                <div className="w-full h-full">{children}</div>
              </div>
            </ScrollContainerProvider>
          )}
        </div>
      </LiveAudioProvider>
    </SessionsLayoutContext.Provider>
  )
}
