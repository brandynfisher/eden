'use client'

import { AgentWorkspaces } from './components/agent-workspaces'
import { SharedChildSessionSidebar } from './components/shared-child-session-sidebar'
import { groupConsecutiveMessages } from './utils/group-messages'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSharedSessionQuery } from '@/hooks/query/use-shared-session-query'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import { BrainIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface SharedSessionProps {
  shareId: string
}

export const SharedSession = ({ shareId }: SharedSessionProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showConductorMessages, setShowConductorMessages] = useState(false)
  const [childShareId, setChildShareId] = useState<string | null>(null)
  const [isChildSidebarOpen, setIsChildSidebarOpen] = useState(false)

  const {
    data: sharedSessionData,
    isLoading,
    error,
  } = useSharedSessionQuery({
    shareId,
    enabled: !!shareId,
  })

  const messages = useMemo(() => {
    if (!sharedSessionData?.share?.messages) return []
    return sharedSessionData.share.messages
  }, [sharedSessionData])

  const messageGroups = useMemo(
    () => groupConsecutiveMessages(messages),
    [messages],
  )

  const session = sharedSessionData?.share?.session
  const agents = session?.agents || []
  const childShares = sharedSessionData?.share?.child_shares
  const hasChildShares = childShares && Object.keys(childShares).length > 0

  // Handle opening a workspace via its share_id
  const handleOpenWorkspace = (shareId: string) => {
    setChildShareId(shareId)
    setIsChildSidebarOpen(true)
  }

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingIndicator />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="w-full max-w-md">
          <AlertDestructive>
            <AlertDescription>
              This shared session could not be found or is no longer available.
            </AlertDescription>
          </AlertDestructive>
        </div>
      </div>
    )
  }

  if (!sharedSessionData?.share) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="w-full max-w-md">
          <AlertDestructive>
            <AlertDescription>
              This shared session is not available.
            </AlertDescription>
          </AlertDestructive>
        </div>
      </div>
    )
  }

  const { share } = sharedSessionData

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto relative">
        {/* Floating controls - Agent Workspaces + Conductor toggle - desktop only */}
        <div className="hidden md:block sticky top-2 z-20 float-right mr-4 space-y-2">
          {/* Show Agent Workspaces if we have child_shares */}
          {hasChildShares && (
            <AgentWorkspaces
              agents={agents}
              agentSessions={childShares}
              onOpenWorkspace={handleOpenWorkspace}
            />
          )}
          {/* Conductor messages toggle - only show for automatic sessions */}
          {session?.session_type === 'automatic' && (
            <button
              onClick={() => setShowConductorMessages(!showConductorMessages)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                'text-sm font-medium transition-colors',
                'border border-blue-500/30',
                showConductorMessages
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-600/10',
              )}
            >
              <BrainIcon className="w-4 h-4" />
              <span className="hidden sm:inline">View Conductor</span>
            </button>
          )}
        </div>

        <div className="p-6 max-w-3xl mx-auto clear-both">
          {/* Session Info */}
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-2xl font-bold mb-2">
              {share.title || 'Shared Conversation'}
            </h1>
            <p className="text-muted-foreground">
              Shared by {share.owner.username} on{' '}
              {new Date(share.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-6">
            {messageGroups.map(group =>
              group.map((message: Message) => {
                if (message.role === 'user') {
                  return (
                    <UserMessage
                      key={message._id}
                      message={message}
                      session={share.session}
                    />
                  )
                } else if (message.role === 'assistant') {
                  return (
                    <OtherMessage
                      key={message._id}
                      message={message}
                      sessionId={share.session._id}
                    />
                  )
                } else if (
                  message.role === 'system' &&
                  message.eden_message_data
                ) {
                  return (
                    <EdenMessage
                      key={message._id}
                      message={message}
                      agents={agents}
                      showConductorMessages={showConductorMessages}
                    />
                  )
                }
                return null
              }),
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Notice */}
          <div className="mt-12 mb-8 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              This is a shared conversation. You cannot interact with this
              session.
            </p>
          </div>
        </div>
      </div>

      {/* Child Session Sidebar for viewing workspaces */}
      {childShareId && (
        <SharedChildSessionSidebar
          shareId={childShareId}
          isOpen={isChildSidebarOpen}
          onClose={() => {
            setIsChildSidebarOpen(false)
            setChildShareId(null)
          }}
        />
      )}
    </div>
  )
}
