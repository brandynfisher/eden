'use client'

import ChatHeader from '@/components/header/chat-header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import SingleAgentSelectorModal from '@/features/chat/components/single-agent-selector-modal'
import AgentCreationsView from '@/features/chat/components/views/agent-creations-view'
import AgentEditView from '@/features/chat/components/views/agent-edit-view'
import AgentMemoryView from '@/features/chat/components/views/agent-memory-view'
import AgentTasksView from '@/features/chat/components/views/agent-tasks-view'
import { ViewMode } from '@/features/chat/types'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
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
}> = ({
  onItemClick,
  agentId,
  agent,
  viewMode,
  onViewModeChange,
  userId,
  onAgentSelect,
  onSettingsClick,
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
      />
    </>
  )
}

const SessionChatLayout = ({ children }: PropsWithChildren) => {
  const { user } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const agentId = params?.agentId as string
  const sessionId = params?.id as string
  const [isMounted, setIsMounted] = useState(false)
  const [resetKey, setResetKey] = useState<number>(0)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { agent } = useAgentQuery({ key: agentId })

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
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

    if (page === 'tasks') {
      setViewMode('tasks')
    } else if (page === 'settings' || tab === 'deployments') {
      setViewMode('settings')
    } else if (page === 'memories') {
      setViewMode('memories')
    } else {
      setViewMode('chat')
    }
  }, [searchParams])

  // Redirect if not owner and trying to access restricted views
  useEffect(() => {
    if (agent && user && !isOwner && viewMode === 'settings') {
      router.push(`/chat/${agentId}`)
    }
  }, [agent, user, isOwner, viewMode, agentId, router])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)

  const handleSidebarToggle = () => {
    if (sidebarPanelRef.current) {
      if (isSidebarCollapsed) {
        sidebarPanelRef.current.expand()
      } else {
        sidebarPanelRef.current.collapse()
      }
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
    // Just reset view mode to chat - no navigation needed since we're already on the right URL
    setViewMode('chat')
  }

  const handleNewChat = () => {
    // Always go to new chat screen regardless of current session
    setViewMode('chat')
    router.push(`/chat/${agentId}`)
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
        agent={agent}
        onChatClick={handleChatClick}
        onAgentSelect={() => setIsAgentSelectorOpen(true)}
        onSettingsClick={() => setViewMode('settings')}
        isSidebarCollapsed={isSidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
        viewMode={viewMode}
        onBackToChat={handleBackToChat}
      />

      <div className="flex flex-col fixed inset-x-0 bottom-0 top-[56px] md:top-[104px]">
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
            className="flex flex-col max-h-full pt-3 px-3 bg-[#0e1421] border-r gap-0 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Session List</SheetTitle>
            <SessionChatSidebarContent
              agent={agent}
              isOwner={isOwner}
              agentId={agentId}
              currentSessionId={sessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onItemClick={() => setIsSheetOpen(false)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              userId={user?._id}
              onAgentSelect={() => setIsAgentSelectorOpen(true)}
              onSettingsClick={() => setViewMode('settings')}
            />
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
            ref={sidebarPanelRef}
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className={cn(
              'hidden md:flex md:flex-col bg-accent border-r p-3 pr-0 transition-all duration-300 ease-in-out',
              'max-w-[320px]',
              isSidebarCollapsed && 'p-0 border-none',
            )}
          >
            {!isSidebarCollapsed && (
              <SessionChatSidebarContent
                agent={agent}
                isOwner={isOwner}
                agentId={agentId}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onItemClick={() => {}}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                userId={user?._id}
                onAgentSelect={() => setIsAgentSelectorOpen(true)}
                onSettingsClick={() => setViewMode('settings')}
              />
            )}
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
          />

          {/* Main Content */}
          <ResizablePanel
            defaultSize={80}
            className="relative flex flex-col bg-aui-background"
          >
            <div className="flex flex-col overflow-y-auto h-full">
              <div
                className="mx-auto flex flex-col flex-1 w-full"
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
    </LiveAudioProvider>
  )
}

export default SessionChatLayout
