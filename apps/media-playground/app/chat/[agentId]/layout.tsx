'use client'

import EdenLogoBw from '@/components/logo/eden-logo-bw'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import TaskFormModal from '@/features/sessions/components/task-form-modal'
import { ViewMode } from '@/features/sessions/components/types'
import { SessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import AgentCreationsView from '@/features/sessions/views/agent-creations-view'
import AgentEditView from '@/features/sessions/views/agent-edit-view'
import AgentMemoryView from '@/features/sessions/views/agent-memory-view'
import AgentTasksView from '@/features/sessions/views/agent-tasks-view'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { CalendarClockIcon, EditIcon, MenuIcon } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

// Custom sidebar content for agent chat
const SessionChatSidebarContent: FC<{
  agent: Agent | null | undefined
  agentId: string
  onItemClick?: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  onSidebarToggle?: () => void
  isCollapsed?: boolean
  isMobileSidebar?: boolean
}> = ({
  onItemClick,
  agentId,
  agent,
  viewMode,
  onViewModeChange,
  onAgentSelect,
  onSettingsClick,
  onSidebarToggle,
  isCollapsed,
  isMobileSidebar,
}) => {
  return (
    <>
      {/* Use existing sessions sidebar content for the rest */}
      <SessionsSidebarContent
        onItemClick={onItemClick}
        agentId={agentId}
        isChat
        agent={agent}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onAgentSelect={onAgentSelect}
        onSettingsClick={onSettingsClick}
        onSidebarToggle={onSidebarToggle}
        isCollapsed={isCollapsed}
        isMobileSidebar={isMobileSidebar}
      />
    </>
  )
}

const SessionChatLayout = ({
  children,
  creationModal,
}: PropsWithChildren<{ creationModal?: React.ReactNode }>) => {
  const { user } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const agentId = params?.agentId as string
  const sessionId = params?.id as string
  const [isMounted, setIsMounted] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [forceHideSidebar, setForceHideSidebar] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const { agent } = useAgentQuery({ key: agentId, enabled: !!agentId })

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)

    // Check if running as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://')
    setIsPWA(isStandalone)

    // Only add overflow-hidden for non-PWA mode
    if (!isStandalone) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.add('pwa-mode')
    }

    return () => {
      document.body.classList.remove('overflow-hidden')
      document.body.classList.remove('pwa-mode')
    }
  }, [])

  const isOwner = useMemo(() => {
    return user?._id === agent?.owner._id
  }, [user, agent])

  // Handle query parameters for view mode
  useEffect(() => {
    if (!searchParams) return

    const page = searchParams.get('page')
    const tab = searchParams.get('tab')

    if (page === 'creations') {
      setViewMode('creations')
    } else if (page === 'tasks') {
      setViewMode('tasks')
    } else if (page === 'settings' || tab === 'deployments') {
      setViewMode('settings')
    } else if (page === 'memories') {
      setViewMode('memories')
    } else if (!page && !tab) {
      // Only reset to chat if there's no page or tab parameter at all
      setViewMode('chat')
    }
  }, [searchParams])

  // Redirect if not owner and trying to access restricted views
  useEffect(() => {
    if (agent && user && !isOwner && viewMode === 'settings') {
      router.push(`/chat/${agentId}`)
    }
  }, [agent, user, isOwner, viewMode, agentId, router])

  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)

  const handleSidebarToggle = () => {
    if (isSidebarCollapsed) {
      // Just toggle state - panel will remount
      setIsSidebarCollapsed(false)
    } else {
      // Collapse the panel
      const panel = sidebarPanelRef.current
      if (panel) {
        panel.collapse()
      }
      setIsSidebarCollapsed(true)
    }
  }

  const handleBackToChat = () => {
    // Reset view mode to chat and clear page query param
    setViewMode('chat')
    const url = new URL(window.location.href)
    url.searchParams.delete('page')
    url.searchParams.delete('tab')
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const handleNewChat = () => {
    // Always go to new chat screen regardless of current session
    setViewMode('chat')
    router.push(`/chat/${agentId}`)
  }

  // Update view mode and sync with URL
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)

    // On mobile, auto-close sidebar when mode changes (user clicked a navigation item)
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setIsSheetOpen(false)
    }

    // Update URL query parameter
    const url = new URL(window.location.href)
    if (mode === 'chat') {
      url.searchParams.delete('page')
      url.searchParams.delete('tab') // Clear tab when going to chat
    } else if (mode === 'settings') {
      url.searchParams.set('page', mode)
      // Keep tab parameter if it exists, or default to profile
      if (!url.searchParams.has('tab')) {
        url.searchParams.set('tab', 'profile')
      }
    } else {
      url.searchParams.set('page', mode)
      url.searchParams.delete('tab') // Clear tab for non-settings modes
    }
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const handleAgentSelect = (selectedAgent: Agent) => {
    // If selecting the same agent we're already on, just close the modal
    if (selectedAgent.username === agentId) {
      setIsAgentSelectorOpen(false)
      return
    }

    router.push(`/chat/${selectedAgent.username}`)
    // Don't close modal immediately - it will close when navigation completes
  }

  // Close agent selector modal when agentId changes (navigation to new agent)
  useEffect(() => {
    setIsAgentSelectorOpen(false)
  }, [agentId])

  // Close agent selector modal when component unmounts (route change)
  useEffect(() => {
    return () => {
      setIsAgentSelectorOpen(false)
    }
  }, [])

  // Create context value before any early returns (hooks must be called in same order)
  const contextValue = useMemo(
    () => ({
      forceHideSidebar,
      setForceHideSidebar,
      openSidebar: () => setIsSheetOpen(true),
    }),
    [forceHideSidebar],
  )

  if (!isMounted) {
    return null
  }

  return (
    <SessionsLayoutContext.Provider value={contextValue}>
      <LiveAudioProvider>
        {/* MOBILE HEADER - Only visible on mobile when NOT on a session page */}
        {!sessionId && (
          <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-2 border-b bg-background px-2">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Tasks title - only show in tasks view */}
            {viewMode === 'tasks' && (
              <h1 className="text-xl font-bold">Tasks</h1>
            )}

            {/* Create Task button - only show in tasks view */}
            {viewMode === 'tasks' && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="ml-auto p-2 hover:bg-muted/50 rounded-lg transition-colors shrink-0"
                aria-label="Create Task"
              >
                <CalendarClockIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            )}

            {/* New Chat button - only show in creations view */}
            {viewMode === 'creations' && (
              <button
                onClick={handleNewChat}
                className="ml-auto p-2 hover:bg-muted/50 rounded-lg transition-colors shrink-0"
                aria-label="New Chat"
              >
                <EditIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </header>
        )}

        <div
          className={cn(
            'flex flex-col fixed inset-x-0 bottom-0 md:top-0',
            !sessionId && 'top-16',
            sessionId && 'top-0',
            isPWA && 'pwa-chat-layout',
          )}
        >
          {/* AGENT SELECTOR MODAL */}
          <SingleAgentSelectorModal
            open={isAgentSelectorOpen}
            onOpenChange={setIsAgentSelectorOpen}
            onSelect={handleAgentSelect}
          />

          {/* MOBILE LEFT BAR SHEET FOR CHAT */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent
              side="left"
              className="flex flex-col max-h-full pt-0 pl-0 pr-0 pb-0 bg-accent border-r gap-0 [&>button]:hidden"
            >
              <SheetTitle className="sr-only">Session List</SheetTitle>
              {/* Mobile sticky header with logo and new chat button */}
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
                    // If on /chat route (no agent selected), open agent selector
                    if (!agentId) {
                      setIsAgentSelectorOpen(true)
                    } else {
                      // If on specific agent route, create new chat with that agent
                      handleNewChat()
                    }
                  }}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  aria-label="New Chat"
                >
                  <EditIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              {/* Scrollable sidebar content */}
              <div className="flex-1 overflow-y-auto pl-3">
                <SessionChatSidebarContent
                  agent={agent}
                  agentId={agentId}
                  onItemClick={() => setIsSheetOpen(false)}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onAgentSelect={() => setIsAgentSelectorOpen(true)}
                  onSettingsClick={() => setSettingsAgentId(agentId)}
                  onSidebarToggle={handleSidebarToggle}
                  isMobileSidebar={true}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* RESIZABLE LAYOUT FOR ALL VIEWS */}
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 !overflow-y-hidden"
            autoSaveId={`resizable-session-chat-layout-${agentId}`}
          >
            {/* Desktop Sidebar */}
            <ResizablePanel
              id="sidebar"
              ref={sidebarPanelRef}
              defaultSize={20}
              minSize={isSidebarCollapsed ? 0 : 15}
              maxSize={30}
              collapsible={false}
              order={1}
              className={cn(
                'hidden md:flex md:flex-col bg-accent border-r transition-all duration-300 ease-in-out',
                isSidebarCollapsed
                  ? 'min-w-[56px] max-w-[56px] w-[56px] p-1.5'
                  : 'max-w-[320px] pl-3 pr-0 pt-0 pb-0',
              )}
            >
              {isSidebarCollapsed ? (
                <SessionChatSidebarContent
                  agent={agent}
                  agentId={agentId}
                  onItemClick={() => {}}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onAgentSelect={() => setIsAgentSelectorOpen(true)}
                  onSettingsClick={() => setSettingsAgentId(agentId)}
                  onSidebarToggle={handleSidebarToggle}
                  isCollapsed={true}
                />
              ) : (
                <SessionChatSidebarContent
                  agent={agent}
                  agentId={agentId}
                  onItemClick={() => {}}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onAgentSelect={() => setIsAgentSelectorOpen(true)}
                  onSettingsClick={() => setSettingsAgentId(agentId)}
                  onSidebarToggle={handleSidebarToggle}
                />
              )}
            </ResizablePanel>

            {/* Separator Handle - hidden, keeping for resizing functionality */}
            <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

            {/* Main Content */}
            <ResizablePanel
              id="content"
              defaultSize={80}
              order={2}
              className="relative flex flex-col bg-aui-background"
            >
              <div className="flex flex-col h-full">
                <div className="mx-auto flex flex-col flex-1 w-full h-full overflow-hidden">
                  {/* CONDITIONAL CONTENT BASED ON VIEW MODE */}
                  {viewMode === 'creations'
                    ? agent && <AgentCreationsView agent={agent} user={user} />
                    : viewMode === 'tasks'
                    ? agent && <AgentTasksView agent={agent} />
                    : viewMode === 'settings'
                    ? agent && (
                        <AgentEditView
                          agent={agent}
                          user={user}
                          sessionId={sessionId}
                          onBackToChat={handleBackToChat}
                          onNewChat={handleNewChat}
                        />
                      )
                    : viewMode === 'memories'
                    ? agent && <AgentMemoryView agent={agent} />
                    : React.isValidElement(children)
                    ? React.cloneElement(children as React.ReactElement, {
                        onOpenSidebar: () => setIsSheetOpen(true),
                      })
                    : children}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Agent Settings Modal */}
        {settingsAgentId && (
          <AgentSettingsModal
            agentId={settingsAgentId}
            open={!!settingsAgentId}
            onOpenChange={open => !open && setSettingsAgentId(null)}
          />
        )}

        {/* Task Form Modal */}
        {agent && (
          <TaskFormModal
            agent={agent}
            open={isTaskModalOpen}
            onOpenChange={setIsTaskModalOpen}
            onSave={() => {
              setIsTaskModalOpen(false)
              // The triggers query will automatically refetch
            }}
          />
        )}

        {/* Intercept creation routes with modal */}
        {creationModal}
      </LiveAudioProvider>
    </SessionsLayoutContext.Provider>
  )
}

export default SessionChatLayout
