'use client'

import AgentLink from '../../agent/agent-link'
import Session from '../session'
// Import shared components
import { SessionsSidebarContent } from './sessions-sidebar'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
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
import { MessageInput } from '@/features/sessions/components/message-input'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useSessionMessageMutation } from '@/hooks/query/use-session-message-mutation'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, SettingsIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useMemo, useState } from 'react'
import * as React from 'react'

// Session Welcome Component
const SessionWelcome: FC<{
  agent: Agent | null | undefined
  onSendMessage: (content: string) => void
  isLoading: boolean
}> = ({ agent, onSendMessage, isLoading }) => {
  const suggestions = agent?.suggestions || []

  return (
    <div className="aui-thread-welcome">
      <div className="aui-thread-welcome-center relative flex flex-col items-center justify-center min-h-full py-8">
        {agent && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {agent.name}
            </div>
            <div className="w-16 h-16 md:w-24 md:h-24 mb-4">
              <img
                src={getCloudfrontOriginalUrl(agent.userImage)}
                alt={agent.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </>
        )}

        <div className="mb-8">
          {agent && (
            <p className="text-lg text-center">
              {agent.greeting || 'What do you want to create today?'}
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex flex-row gap-2 flex-wrap justify-center">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className="text-sm hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 px-3 py-2"
                  onClick={() => onSendMessage(suggestion.prompt)}
                  disabled={isLoading}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
}> = ({ agent, isOwner, handleEditClick, onItemClick }) => {
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
      <SessionsSidebarContent onItemClick={onItemClick} />
    </>
  )
}

// Mobile Sheet
const LeftBarSheet: FC<{
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  agentId: string
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}> = ({
  agent,
  isOwner,
  handleEditClick,
  agentId,
  currentSessionId,
  onSessionSelect,
  onNewSession,
}) => {
  const [open, setOpen] = useState(false)
  const handleCloseSheet = () => setOpen(false)

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
          onItemClick={handleCloseSheet}
          onSessionSelect={onSessionSelect}
          onNewSession={onNewSession}
        />
      </SheetContent>
    </Sheet>
  )
}

// Main Component - Wrapper that uses Session component once sessionId exists
type Props = {
  agentId: string
  sessionId?: string
}

const SessionChat: FC<Props> = ({ agentId, sessionId: initialSessionId }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    initialSessionId,
  )
  const { user } = useAuthState()

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
    invalidate: invalidateAgent,
  } = useAgentQuery({ key: agentId })

  const sendMessageMutation = useSessionMessageMutation()

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
    setCurrentSessionId(sessionId)
    // Navigate to the session URL
    router.push(`/chat/${agentId}/${sessionId}`)
  }

  const handleNewSession = () => {
    setCurrentSessionId(undefined)
    // Navigate to the new session URL
    router.push(`/chat/${agentId}`)
  }

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    try {
      // Create new session for first message
      const result = await sendMessageMutation.mutateAsync({
        content,
        attachments,
        agent_ids: [agentId],
        title: content.length > 50 ? content.slice(0, 50) + '...' : content,
      })

      if ('session_id' in result && result.session_id) {
        // Navigate to the new session
        router.push(`/chat/${agentId}/${result.session_id}`)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!isMounted) {
    return null
  }

  // If we have a sessionId, use the actual Session component
  if (currentSessionId) {
    return <Session />
  }

  // Otherwise show the welcome screen with sidebar
  return (
    <div className="flex flex-col fixed inset-x-0 bottom-0 top-16">
      {/* Mobile Header */}
      <div className="bg-[#0e1421] border-b px-2 py-2 md:hidden flex items-center justify-between">
        <LeftBarSheet
          agent={agent}
          isOwner={isOwner}
          handleEditClick={handleEditClick}
          agentId={agentId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
        />
        <div className="ml-auto flex items-center gap-2">
          {agent ? (
            <>
              <AgentLink
                agent={agent}
                className="max-w-[120px] xs:max-w-[300px]"
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
      </div>

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
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
            />
          )}
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
        />

        {/* Main Content */}
        <ResizablePanel defaultSize={80} className="flex flex-col">
          <main className="flex-1 overflow-hidden flex flex-col">
            {!agent ? (
              <div className="flex-1 flex justify-center items-center">
                <LoadingIndicator className="w-10 h-10 text-purple-600" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
                <SessionWelcome
                  agent={agent}
                  onSendMessage={handleSendMessage}
                  isLoading={sendMessageMutation.isPending}
                />
              </div>
            )}

            {agentError && (
              <div className="p-4">
                <AlertDestructive title="Error loading agent">
                  <AlertDescription>
                    {agentErrorDetails?.message}
                  </AlertDescription>
                </AlertDestructive>
              </div>
            )}
          </main>

          {/* Message Input - Only show when no session exists */}
          {!currentSessionId && agent && (
            <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
              <MessageInput
                sessionId="new"
                onStreamingMessage={handleSendMessage}
              />
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default SessionChat
