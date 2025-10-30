'use client'

import ChatHeader from '@/components/header/chat-header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { ViewMode } from '@/features/sessions/components/types'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import AgentCreationsView from '@/features/sessions/views/agent-creations-view'
import AgentEditView from '@/features/sessions/views/agent-edit-view'
import AgentMemoryView from '@/features/sessions/views/agent-memory-view'
import AgentTasksView from '@/features/sessions/views/agent-tasks-view'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Agent, SessionV2 } from '@edenlabs/eden-sdk'
import { MenuIcon } from 'lucide-react'
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
  isOwner: boolean
  agentId: string
  currentSessionId?: string
  onItemClick?: () => void
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  userId?: string | null
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  session?: SessionV2
  onSidebarToggle?: () => void
}> = ({
  onItemClick,
  agentId,
  agent,
  viewMode,
  onViewModeChange,
  userId,
  onAgentSelect,
  onSettingsClick,
  currentSessionId,
  session,
  onSidebarToggle,
}) => {
  return (
    <>
      {/* Use existing sessions sidebar content for the rest */}
      <SessionsSidebarContent
        onItemClick={onItemClick}
        agentId={agentId}
        isChat
        agent={agent}
        userId={userId}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onAgentSelect={onAgentSelect}
        onSettingsClick={onSettingsClick}
        sessionId={currentSessionId}
        session={session}
        onSidebarToggle={onSidebarToggle}
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
  const [resetKey, setResetKey] = useState<number>(0)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const { agent } = useAgentQuery({ key: agentId })
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

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
    } else if (!page) {
      // Only reset to chat if there's no page parameter at all
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

  const handleSessionSelect = (sessionId: string) => {
    // Navigate to the session URL
    router.push(`/chat/${agentId}/${sessionId}`)
  }

  const handleNewSession = () => {
    // If we're already on the base agent route, just reset the state
    if (!sessionId) {
      setResetKey(prev => prev + 1)
    } else {
      // Navigate to the new session URL
      router.push(`/chat/${agentId}`)
    }
  }

  const handleChatClick = () => {
    // Check if we're on mobile (window width < 768px for md breakpoint)
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Mobile: Open the slideout sidebar
      setIsSheetOpen(true)
    } else {
      // Desktop: Start a new session by navigating to base chat URL (no sessionId)
      // This mimics the behavior of clicking "New Session" in the sidebar
      router.push(`/chat/${agentId}`)
    }
  }

  const handleBackToChat = () => {
    // Reset view mode to chat and clear page query param
    setViewMode('chat')
    const url = new URL(window.location.href)
    url.searchParams.delete('page')
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

    // On mobile, auto-open sidebar when mode changes
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setIsSheetOpen(true)
    }

    // Update URL query parameter
    const url = new URL(window.location.href)
    if (mode === 'chat') {
      url.searchParams.delete('page')
    } else {
      url.searchParams.set('page', mode)
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

  if (!isMounted) {
    return null
  }

  return (
    <LiveAudioProvider>
      {/* Chat-specific header that replaces the main header */}
      <ChatHeader
        className={isPWA ? 'pwa-chat-header' : ''}
        onChatClick={handleChatClick}
      />

      <div
        className={cn(
          'flex flex-col fixed inset-x-0 bottom-0 top-[56px] md:top-[56px]',
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
            className="flex flex-col h-full pt-3 px-3 bg-[#0e1421] border-r gap-0 overflow-hidden"
          >
            <SheetTitle className="sr-only">Session List</SheetTitle>
            <div className="flex flex-col flex-1 min-h-0">
              <SessionChatSidebarContent
                agent={agent}
                isOwner={isOwner}
                agentId={agentId}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onItemClick={() => setIsSheetOpen(false)}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                userId={user?._id}
                onAgentSelect={() => setIsAgentSelectorOpen(true)}
                onSettingsClick={() => handleViewModeChange('settings')}
                session={session}
                onSidebarToggle={handleSidebarToggle}
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
          {!isSidebarCollapsed && (
            <ResizablePanel
              id="sidebar"
              ref={sidebarPanelRef}
              defaultSize={20}
              minSize={18}
              maxSize={35}
              order={1}
              className={cn(
                'hidden md:flex md:flex-col bg-accent border-r p-3 pr-0 overflow-hidden',
              )}
            >
              <div className="flex flex-col flex-1 min-h-0">
                <SessionChatSidebarContent
                  agent={agent}
                  isOwner={isOwner}
                  agentId={agentId}
                  currentSessionId={sessionId}
                  onSessionSelect={handleSessionSelect}
                  onNewSession={handleNewSession}
                  onItemClick={() => {}}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  userId={user?._id}
                  onAgentSelect={() => setIsAgentSelectorOpen(true)}
                  onSettingsClick={() => handleViewModeChange('settings')}
                  session={session}
                  onSidebarToggle={handleSidebarToggle}
                />
              </div>
            </ResizablePanel>
          )}

          {/* Resizable Handle or Hamburger Button */}
          {isSidebarCollapsed ? (
            // Show hamburger button when sidebar is collapsed - full height clickable
            <button
              onClick={handleSidebarToggle}
              className="hidden md:flex flex-col items-center w-8 bg-accent border-r border-border relative hover:bg-muted/20 transition-colors pt-3"
              title="Open sidebar"
            >
              <MenuIcon className="h-4 w-4 shrink-0" />
            </button>
          ) : (
            // Show resizable handle when sidebar is open
            <ResizableHandle
              withHandle
              className="hidden md:flex w-1 bg-transparent hover:bg-primary/10 [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary relative cursor-col-resize"
            />
          )}

          {/* Main Content */}
          <ResizablePanel
            id="content"
            defaultSize={80}
            order={2}
            className="relative flex flex-col bg-aui-background"
          >
            <div className="flex flex-col h-full">
              <div
                className="mx-auto flex flex-col flex-1 w-full h-full overflow-hidden"
                key={resetKey}
              >
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
                  : children}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Intercept creation routes with modal */}
      {creationModal}
    </LiveAudioProvider>
  )
}

export default SessionChatLayout
