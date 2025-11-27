'use client'

import { AssistantMessage } from '@/features/sessions/components/assistant-message'
import { EdenMessage } from '@/features/sessions/components/eden-message'
import { SystemMessage } from '@/features/sessions/components/system-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import { XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ChildSessionSidebarProps {
  sessionId: string
  onClose: () => void
  isOpen: boolean
}

export const ChildSessionSidebar = ({
  sessionId,
  onClose,
  isOpen,
}: ChildSessionSidebarProps) => {
  const { user } = useAuthState()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { data: session, isLoading } = useSessionQuery({
    sessionId,
    enabled: !!sessionId && isOpen,
  })

  // Scroll to bottom when messages change - only within this container
  useEffect(() => {
    if (session?.messages && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [session?.messages])

  // Show avatars if more than 2 participants
  const totalParticipants =
    (session?.users?.length || 0) + (session?.agents?.length || 0)
  const showAvatars = totalParticipants > 2

  const messages = session?.messages || []

  return (
    <div
      className={cn(
        'flex flex-col bg-background border-l border-border',
        'w-full sm:w-[380px] lg:w-[420px] flex-shrink-0',
        'transition-all duration-300 ease-out',
        isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Agent avatar */}
          {session?.agents?.[0] && (
            <div className="w-8 h-8 rounded-full border border-border overflow-hidden flex-shrink-0">
              {session.agents[0].userImage ? (
                <img
                  src={getCloudfrontUrl(session.agents[0].userImage)}
                  alt={session.agents[0].name || 'Agent'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                  {session.agents[0].name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
          )}
          {/* Title */}
          <h3 className="font-medium text-sm truncate">
            {session?.title || 'Child Session'}
          </h3>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          aria-label="Close sidebar"
        >
          <XIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground text-sm">
              Loading session...
            </div>
          </div>
        ) : !session ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-sm">
              Session not found
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-sm">No messages yet</div>
          </div>
        ) : (
          messages.map((message: Message) => {
            const isEdenMessage = message.role === 'eden'
            const isSystemMessage = message.role === 'system'
            const isAssistantMessage = message.role === 'assistant'
            const isUserMessage =
              message.role === 'user' || message.sender?._id === user?._id

            if (isEdenMessage) {
              return <EdenMessage key={message._id} message={message} />
            }

            if (isSystemMessage) {
              return <SystemMessage key={message._id} message={message} />
            }

            if (isAssistantMessage) {
              return (
                <AssistantMessage
                  key={message._id}
                  sessionId={sessionId}
                  message={message}
                  showAvatar={showAvatars}
                  isStreamingTokens={false}
                />
              )
            }

            if (isUserMessage) {
              return (
                <UserMessage
                  key={message._id}
                  message={message}
                  session={session}
                />
              )
            }

            return null
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
