'use client'

import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SessionsSidebar } from '@/features/sessions/components/sessions-sidebar'
import { cn } from '@/lib/utils'
import { ChevronRightIcon } from 'lucide-react'
import { FC, PropsWithChildren, useState } from 'react'

const LeftBarSheet: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const [open, setOpen] = useState(false)
  const handleCloseSheet = () => {
    setOpen(false)
    onItemClick?.()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 md:hidden gap-1"
        >
          <ChevronRightIcon className={'size-4'} />
          View Sessions
          <span className="sr-only">Toggle session list menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col max-h-full pt-10 px-3 bg-[#0e1421] border-r gap-0"
      >
        <SheetTitle className="sr-only">Session List</SheetTitle>
        <SessionsSidebar onItemClick={handleCloseSheet} />
      </SheetContent>
    </Sheet>
  )
}

export default function SessionsLayout({ children }: PropsWithChildren) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* MOBILE-ONLY HEADER */}
      <div className="bg-[#0e1421] border-b px-2 py-2 md:hidden flex items-center justify-between">
        <LeftBarSheet onItemClick={() => {}} />
      </div>

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
            'hidden md:flex md:flex-col bg-[#0e1421] border-r transition-all duration-300 ease-in-out',
            'max-w-[320px]',
            isSidebarCollapsed && 'p-0 border-none',
          )}
        >
          {/* Render content only if not collapsed */}
          {!isSidebarCollapsed && <SessionsSidebar />}
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
  )
}
