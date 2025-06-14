'use client'

import AgentLink from '../../features/agent/agent-link'
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
import { Skeleton } from '@/components/ui/skeleton'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, SettingsIcon } from 'lucide-react'
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
}> = ({ agent, isOwner, handleEditClick, onItemClick, agentId }) => {
  return (
    <>
      <div className="flex items-center justify-between gap-2 ml-2">
        {agent ? (
          <>
            <AgentLink
              agent={agent}
              className={cn(
                isOwner ? 'max-w-[calc(100%-2.5rem)]' : 'max-w-full',
              )}
            />
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 size-8"
                onClick={handleEditClick}
              >
                <SettingsIcon className="size-4" />
              </Button>
            )}
          </>
        ) : (
          <Skeleton className="w-[120px] h-8" />
        )}
      </div>
      {/* New session button */}
      <div className="border-b mb-2 mt-2" />
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
  const sessionId = params.sessionId as string
  const [isMounted, setIsMounted] = useState(false)
  const [resetKey, setResetKey] = useState<number>(0)

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

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* MOBILE-ONLY HEADER */}
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

      {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}
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
            'hidden md:flex md:flex-col bg-[#0e1421] border-r p-3 pr-0 transition-all duration-300 ease-in-out max-w-[320px]',
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
            <div className="mx-auto flex flex-col flex-1 w-full" key={resetKey}>
              {children}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default SessionChatLayout
