'use client'

import EdenLogoBw from '@/components/logo/eden-logo-bw'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ScrollContainerProvider } from '@/contexts/scroll-container-context'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { cn } from '@/lib/utils'
import { MenuIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Main /create page gets padding, tool pages get no padding
  const isMainPage = pathname === '/create'

  // Listen for custom toggle-sidebar event
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsSheetOpen(true)
    }

    window.addEventListener('toggle-sidebar', handleToggleSidebar)
    return () =>
      window.removeEventListener('toggle-sidebar', handleToggleSidebar)
  }, [])

  return (
    <div className="flex flex-col fixed inset-0">
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={() => setIsSheetOpen(true)}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Tools</h1>
      </div>

      {/* MOBILE LEFT BAR SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="left"
          className="flex flex-col max-h-full pt-0 pl-0 pr-0 pb-0 bg-accent border-r gap-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {/* Mobile sticky header with logo */}
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
          </div>
          {/* Scrollable sidebar content */}
          <div className="flex-1 overflow-y-auto pl-3">
            <SessionsSidebarContent
              onItemClick={() => setIsSheetOpen(false)}
              mode="create"
              isMobileSidebar={true}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 md:flex-row overflow-hidden">
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
                mode="create"
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
            <ScrollContainerProvider value={scrollRef}>
              <div className="flex flex-col h-full overflow-hidden">
                <div
                  ref={scrollRef}
                  className="mx-auto flex flex-col h-full w-full overflow-y-auto"
                >
                  {isMainPage ? (
                    <div className="p-4">{children}</div>
                  ) : (
                    children
                  )}
                </div>
              </div>
            </ScrollContainerProvider>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default PageLayout
