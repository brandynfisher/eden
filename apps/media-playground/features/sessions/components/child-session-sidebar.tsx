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
import { ExternalLinkIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'

interface ChildSessionSidebarProps {
  sessionId: string
  parentSessionId?: string
  onClose: () => void
  isOpen: boolean
}

export const ChildSessionSidebar = ({
  sessionId,
  parentSessionId,
  onClose,
  isOpen,
}: ChildSessionSidebarProps) => {
  const { user } = useAuthState()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const { data: session, isLoading } = useSessionQuery({
    sessionId,
    parentSessionId,
    enabled: !!sessionId && isOpen,
  })

  // Check if user is scrolled to bottom (with 50px threshold)
  const checkIsAtBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    const threshold = 50
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold
    )
  }, [])

  // Handle scroll events to track if user is at bottom
  const handleScroll = useCallback(() => {
    isAtBottomRef.current = checkIsAtBottom()
  }, [checkIsAtBottom])

  // Scroll to bottom when messages change - only if user is already at bottom
  useEffect(() => {
    if (
      session?.messages &&
      scrollContainerRef.current &&
      isAtBottomRef.current
    ) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [session?.messages])

  // Hide avatars only if there's exactly 1 agent, exactly 1 user, and that user is you
  const showAvatars = !(
    session?.agents?.length === 1 &&
    session?.users?.length === 1 &&
    session?.users?.[0]?._id === user?._id
  )

  // Prepend session context as a system message if it exists
  const messages = (() => {
    const baseMessages = session?.messages || []
    if (session?.context && session.context.trim()) {
      const sessionContextMessage = {
        _id: `session-context-${sessionId}`,
        session: [sessionId],
        role: 'system' as const,
        content: session.context,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        attachments: [],
        reactions: {},
        sender: { _id: 'system', username: 'system', name: 'System' },
        session_context: true,
      } as Message & { session_context: boolean }
      return [sessionContextMessage, ...baseMessages]
    }
    return baseMessages
  })()

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
            {session?.title || 'Subsession'}
          </h3>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Open in new page link */}
          <Link
            href={`/sessions/${sessionId}`}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Open session in new page"
          >
            <ExternalLinkIcon className="w-4 h-4 text-muted-foreground" />
          </Link>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
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
