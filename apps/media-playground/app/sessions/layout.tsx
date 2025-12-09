'use client'

import SessionsHeader from '@/components/header/sessions-header'
import { type AppShellConfig, useAppShell } from '@/components/layout/app-shell'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { ScrollContainerProvider } from '@/contexts/scroll-container-context'
import { SessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { EditIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export default function SessionsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const [forceHideSidebar, setForceHideSidebar] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isShareRoute = pathname?.includes('/sessions/share/')
  const canShowSidebar = useMemo(
    () => !isShareRoute && !forceHideSidebar,
    [forceHideSidebar, isShareRoute],
  )

  const mobileSidebarHeader = useCallback<
    NonNullable<AppShellConfig['mobileSidebarHeader']>
  >(
    ({ close }) => (
      <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2" onClick={close}>
          <EdenLogoBw className="w-[28px]" />
        </Link>
        <Link
          href="/sessions/new"
          onClick={close}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
          aria-label="New Session"
        >
          <EditIcon className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>
    ),
    [],
  )

  useEffect(() => {
    setConfig({
      sidebarVariant: 'sessions',
      showShell: canShowSidebar,
      mobileSidebarHeader,
    })

    return () => resetConfig()
  }, [canShowSidebar, mobileSidebarHeader, resetConfig, setConfig])

  const handleChatClick = () => {
    if (!canShowSidebar) {
      return
    }
    openMobileSidebar()
  }

  const contextValue = useMemo(
    () => ({
      forceHideSidebar,
      setForceHideSidebar,
      openSidebar: canShowSidebar ? openMobileSidebar : undefined,
    }),
    [canShowSidebar, forceHideSidebar, openMobileSidebar],
  )

  if (isShareRoute) {
    return (
      <SessionsLayoutContext.Provider value={contextValue}>
        <LiveAudioProvider>
          <SessionsHeader
            onChatClick={handleChatClick}
            isSidebarCollapsed={!canShowSidebar}
          />
          <div className="flex flex-col fixed inset-x-0 bottom-0 top-16 md:top-0">
            <ScrollContainerProvider value={scrollRef}>
              <div
                className="flex-1 overflow-y-auto bg-background"
                ref={scrollRef}
              >
                <div className="mx-auto w-full max-w-4xl h-full">
                  {children}
                </div>
              </div>
            </ScrollContainerProvider>
          </div>
        </LiveAudioProvider>
      </SessionsLayoutContext.Provider>
    )
  }

  return (
    <SessionsLayoutContext.Provider value={contextValue}>
      <LiveAudioProvider>
        <SessionsHeader
          onChatClick={handleChatClick}
          isSidebarCollapsed={!canShowSidebar}
        />
        {children}
      </LiveAudioProvider>
    </SessionsLayoutContext.Provider>
  )
}
