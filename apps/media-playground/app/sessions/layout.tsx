'use client'

import SessionsHeader from '@/components/header/sessions-header'
import { useAppShell } from '@/components/layout/app-shell'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { ScrollContainerProvider } from '@/contexts/scroll-container-context'
import { SessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { EditIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'

export default function SessionsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const router = useRouter()
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const [forceHideSidebar, setForceHideSidebar] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isShareRoute = pathname?.includes('/sessions/share/')
  const canShowSidebar = useMemo(
    () => !isShareRoute && !forceHideSidebar,
    [forceHideSidebar, isShareRoute],
  )

  useEffect(() => {
    setConfig({
      sidebarVariant: 'sessions',
      showShell: canShowSidebar,
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
              router.push('/')
            }}
            className="flex items-center gap-2"
          >
            <EdenLogoBw className="w-[28px]" />
          </button>
          <button
            onClick={() => {
              close()
              router.push('/sessions/new')
            }}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="New Session"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [canShowSidebar, resetConfig, router, setConfig])

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
