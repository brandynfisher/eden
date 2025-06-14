'use client'

import AgentLink from '../../features/agent/agent-link'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import { SettingsIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'

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

const SessionChatLayout = ({ children }: PropsWithChildren) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const params = useParams()
  const agentId = params.agentId as string
  const sessionId = params.sessionId as string
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuthState()

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
    // Navigate to the new session URL
    router.push(`/chat2/${agentId}`)
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* Resizable Layout */}
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
            <div className="mx-auto flex flex-col flex-1 w-full">
              {children}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default SessionChatLayout
