'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  PropsWithChildren,
  ReactNode,
  createContext,
  useContext,
  useState,
} from 'react'

type Props = PropsWithChildren & {
  title?: string
  sidebar: ReactNode
  wrapClassName?: string
}

// Context for sidebar controls
type SidebarContextType = {
  openSidebar: () => void
  isSidebarOpen: boolean
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarLayout')
  }
  return context
}

const SidebarLayout = ({ children, title, sidebar, wrapClassName }: Props) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <SidebarContext.Provider
      value={{
        openSidebar: () => setIsSidebarOpen(true),
        isSidebarOpen,
      }}
    >
      <div className="flex h-[calc(100vh_-_theme(spacing.16))] bg-background">
        {/* Desktop Sidebar - hidden at 2/3 MacBook width (around 900px) */}
        <aside
          className="hidden xl:flex w-64 bg-accent border-r border-border flex-col p-2 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(156 163 175 / 0.3) transparent',
          }}
        >
          {title && (
            <div className="mb-4">
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          )}
          {sidebar}
        </aside>

        {/* Sidebar Sheet for medium and mobile */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent
            side="left"
            className="flex flex-col max-h-full pt-10 px-2 bg-accent border-r gap-0 w-64"
          >
            {title && (
              <div className="mb-4">
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            )}
            {sidebar}
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div
            className={cn([
              'flex flex-1 flex-col gap-4 p-2 pt-4 md:p-4 lg:pt-4',
              wrapClassName,
            ])}
          >
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  )
}

export default SidebarLayout
