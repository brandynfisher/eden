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
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PropsWithChildren,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type MobileSidebarHeaderRenderer = (helpers: { close: () => void }) => ReactNode

export type AppShellConfig = {
  showShell: boolean
  sidebarVariant: 'chat' | 'sessions'
  mobileSidebarHeader?: MobileSidebarHeaderRenderer
}

type AppShellContextValue = {
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  setConfig: (config: Partial<AppShellConfig>) => void
  resetConfig: () => void
  config: AppShellConfig
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export const useAppShell = () => {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider')
  }
  return context
}

export const useOptionalAppShell = () => useContext(AppShellContext)

const DISABLE_PREFIXES = ['/sign-in', '/sign-up', '/new', '/studio']
const CHAT_VARIANT_PREFIXES = ['/chat', '/agents', '/tasks']
export const SIDEBAR_COLLAPSE_STORAGE_KEY = 'eden:sidebar-collapsed'

const shouldDisableShell = (pathname?: string | null) => {
  if (!pathname) {
    return false
  }
  if (pathname.startsWith('/new/agent')) {
    return false
  }
  if (pathname.includes('/sessions/share')) {
    return true
  }
  // /chat routes now use the app shell
  return DISABLE_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

const isChatVariantRoute = (pathname?: string | null) => {
  if (!pathname) {
    return false
  }
  if (pathname === '/') {
    return true
  }
  return CHAT_VARIANT_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

const defaultMobileHeader: MobileSidebarHeaderRenderer = ({ close }) => {
  return (
    <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
      <Link
        href="/agents"
        className="flex items-center gap-2"
        onClick={() => close()}
      >
        <EdenLogoBw className="w-[28px]" />
        <span className="text-lg font-semibold">Eden</span>
      </Link>
    </div>
  )
}

const getDefaultConfig = (pathname?: string | null): AppShellConfig => ({
  showShell: !shouldDisableShell(pathname),
  sidebarVariant: isChatVariantRoute(pathname) ? 'chat' : 'sessions',
})

const AppShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname()
  const defaultConfig = useMemo(() => getDefaultConfig(pathname), [pathname])
  const [overrides, setOverrides] = useState<Partial<AppShellConfig>>({})
  const config = useMemo(
    () => ({
      ...defaultConfig,
      ...overrides,
    }),
    [defaultConfig, overrides],
  )

  useEffect(() => {
    setOverrides({})
  }, [defaultConfig])

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    try {
      return (
        window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === 'true'
      )
    } catch {
      return false
    }
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  const openMobileSidebar = useCallback(() => {
    setIsSheetOpen(true)
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  const setConfig = useCallback((value: Partial<AppShellConfig>) => {
    setOverrides(prev => ({ ...prev, ...value }))
  }, [])

  const resetConfig = useCallback(() => {
    setOverrides({})
  }, [])

  useEffect(() => {
    const handleToggle = () => setIsSheetOpen(true)
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    if (!config.showShell) {
      setIsSheetOpen(false)
    }
  }, [config.showShell])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSE_STORAGE_KEY,
        isSidebarCollapsed ? 'true' : 'false',
      )
    } catch {
      // Ignore storage failures
    }
  }, [isSidebarCollapsed])

  const providerValue = useMemo(
    () => ({
      openMobileSidebar,
      closeMobileSidebar,
      setConfig,
      resetConfig,
      config,
    }),
    [openMobileSidebar, closeMobileSidebar, setConfig, resetConfig, config],
  )

  const headerRenderer = config.mobileSidebarHeader ?? defaultMobileHeader

  return (
    <AppShellContext.Provider value={providerValue}>
      {config.showShell ? (
        <>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
              side="left"
              className="flex h-full max-h-full flex-col pt-0 pl-0 pr-0 pb-0 bg-accent border-r gap-0 [&>button]:hidden"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {headerRenderer({ close: closeMobileSidebar })}
              <div className="flex-1 overflow-y-auto pl-3">
                <SessionsSidebarContent
                  onItemClick={() => setIsSheetOpen(false)}
                  isChat={config.sidebarVariant === 'chat'}
                  isMobileSidebar={true}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 min-h-0 h-full flex-col md:flex-row overflow-hidden">
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 min-h-0 h-full !overflow-y-hidden"
            >
              <ResizablePanel
                defaultSize={20}
                minSize={isSidebarCollapsed ? 0 : 15}
                maxSize={30}
                collapsible={false}
                className={cn(
                  'hidden h-full min-h-0 md:flex md:flex-col bg-accent border-r transition-all duration-300 ease-in-out',
                  isSidebarCollapsed
                    ? 'min-w-[56px] max-w-[56px] w-[56px] p-1.5'
                    : 'max-w-[320px] pl-3 pr-0 pt-0 pb-0',
                )}
              >
                {isSidebarCollapsed ? (
                  <SessionsSidebarContent
                    onSidebarToggle={() => setIsSidebarCollapsed(false)}
                    isCollapsed={true}
                    isChat={config.sidebarVariant === 'chat'}
                  />
                ) : (
                  <SessionsSidebarContent
                    onSidebarToggle={() => setIsSidebarCollapsed(true)}
                    isChat={config.sidebarVariant === 'chat'}
                  />
                )}
              </ResizablePanel>

              <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

              <ResizablePanel
                defaultSize={80}
                className="relative flex flex-1 min-h-0 h-full flex-col bg-background -ml-px"
              >
                <ScrollContainerProvider value={scrollRef}>
                  <div className="flex flex-col h-full min-h-0 overflow-hidden">
                    <div
                      ref={scrollRef}
                      className="mx-auto flex flex-col h-full w-full min-h-0 overflow-y-auto"
                    >
                      {children}
                    </div>
                  </div>
                </ScrollContainerProvider>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      ) : (
        children
      )}
    </AppShellContext.Provider>
  )
}

export default AppShell
