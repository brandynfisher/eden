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
import { AgentBar } from '@/features/chat/components/agent-bar'
import SingleAgentSelectorModal from '@/features/chat/components/single-agent-selector-modal'
import AgentCreationsView from '@/features/chat/components/views/agent-creations-view'
import AgentEditView from '@/features/chat/components/views/agent-edit-view'
import AgentTasksView from '@/features/chat/components/views/agent-tasks-view'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { ChevronRightIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Custom sidebar content for agent chat
const SessionChatSidebarContent: FC<{
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  agentId: string
  currentSessionId?: string
  onItemClick?: () => void
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}> = ({ onItemClick, agentId }) => {
  return (
    <>
      {/* Use existing sessions sidebar content for the rest */}
      <SessionsSidebarContent
        onItemClick={onItemClick}
        agentId={agentId}
        isChat
      />
    </>
  )
}

const LeftBarSheet: FC<{
  onItemClick?: () => void
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  agentId: string
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}> = ({
  onItemClick,
  agent,
  isOwner,
  handleEditClick,
  agentId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}) => {
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
        <SessionChatSidebarContent
          agent={agent}
          isOwner={isOwner}
          handleEditClick={handleEditClick}
          agentId={agentId}
          currentSessionId={currentSessionId}
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
          onItemClick={handleCloseSheet}
        />
      </SheetContent>
    </Sheet>
  )
}

const SessionChatLayout = ({ children }: PropsWithChildren) => {
  const { user, isSignedIn } = useAuthState()
  const router = useRouter()
  // Check if user has sessions_v2 feature flag
  useEffect(() => {
    if (
      isSignedIn &&
      user &&
      !user.featureFlags?.includes(FeatureFlag.SessionsV2)
    ) {
      router.push('/')
    }
  }, [isSignedIn, user, router])
  const dispatch = useAppDispatch()
  const params = useParams()
  const agentId = params.agentId as string
  const sessionId = params.id as string
  const [isMounted, setIsMounted] = useState(false)
  const [resetKey, setResetKey] = useState<number>(0)
  const [viewMode, setViewMode] = useState<
    'chat' | 'creations' | 'tasks' | 'settings'
  >('chat')
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { agent, invalidate: invalidateAgent } = useAgentQuery({ key: agentId })

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  const handleEditClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'update',
        agentId: agentId,
        onAction: async () => {
          await invalidateAgent()
        },
      }),
    )
  }

  const isOwner = useMemo(() => {
    return user?._id === agent?.owner._id
  }, [user, agent])

  // Redirect non-owners away from owner-only views
  useEffect(() => {
    if (agent && user && !isOwner && viewMode === 'settings') {
      setViewMode('chat')
    }
  }, [agent, user, isOwner, viewMode])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleSessionSelect = (sessionId: string) => {
    // Navigate to the session URL
    router.push(`/chat2/${agentId}/${sessionId}`)
  }

  const handleNewSession = () => {
    // If we're already on the base agent route, just reset the state
    if (!sessionId) {
      setResetKey(prev => prev + 1)
    } else {
      // Navigate to the new session URL
      router.push(`/chat2/${agentId}`)
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
      router.push(`/chat2/${agentId}`)
    }
  }

  const handleAgentSelect = (selectedAgent: Agent) => {
    // If selecting the same agent we're already on, just close the modal
    if (selectedAgent.username === agentId) {
      setIsAgentSelectorOpen(false)
      return
    }

    router.push(`/chat2/${selectedAgent.username}`)
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
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* AGENT BAR - Always visible */}
      <AgentBar
        agent={agent}
        isOwner={isOwner}
        onChatClick={handleChatClick}
        onAgentSelect={() => setIsAgentSelectorOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* AGENT SELECTOR MODAL */}
      <SingleAgentSelectorModal
        open={isAgentSelectorOpen}
        onOpenChange={setIsAgentSelectorOpen}
        onSelect={handleAgentSelect}
      />

      {/* MOBILE-ONLY HEADER - only show for chat view */}
      {viewMode === 'chat' && (
        <div className="bg-[#0e1421] border-b px-2 py-2 md:hidden flex items-center justify-between">
          <LeftBarSheet
            onItemClick={() => {}}
            agent={agent}
            isOwner={isOwner}
            handleEditClick={handleEditClick}
            agentId={agentId}
            currentSessionId={sessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
          />
        </div>
      )}

      {/* MOBILE LEFT BAR SHEET FOR CHAT */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="left"
          className="flex flex-col max-h-full pt-10 px-3 bg-[#0e1421] border-r gap-0"
        >
          <SheetTitle className="sr-only">Session List</SheetTitle>
          <SessionChatSidebarContent
            agent={agent}
            isOwner={isOwner}
            handleEditClick={handleEditClick}
            agentId={agentId}
            currentSessionId={sessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onItemClick={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* CONDITIONAL MAIN CONTENT BASED ON VIEW MODE */}
      {viewMode === 'creations' ? (
        /* CREATIONS VIEW - Full width */
        agent && <AgentCreationsView agent={agent} user={user} />
      ) : viewMode === 'tasks' ? (
        /* TASKS VIEW - Full width */
        agent && <AgentTasksView agent={agent} />
      ) : viewMode === 'settings' ? (
        /* SETTINGS VIEW - Full width */
        agent && <AgentEditView agent={agent} user={user} />
      ) : (
        /* CHAT VIEW - Resizable layout */
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 !overflow-y-hidden"
          autoSaveId={`resizable-session-chat-layout-${agentId}`}
        >
          {/* Desktop Sidebar */}
          <ResizablePanel
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
                handleEditClick={handleEditClick}
                agentId={agentId}
                currentSessionId={sessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onItemClick={() => {}}
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
                {children}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}

export default SessionChatLayout
