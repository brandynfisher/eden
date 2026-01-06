'use client'

import { EdenMessage } from '@/features/sessions/components/eden-message'
import { OtherMessage } from '@/features/sessions/components/other-message'
import { SystemMessage } from '@/features/sessions/components/system-message'
import { UserMessage } from '@/features/sessions/components/user-message'
import { useSharedSessionQuery } from '@/hooks/query/use-shared-session-query'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import { XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

interface SharedChildSessionSidebarProps {
  shareId: string
  onClose: () => void
  isOpen: boolean
}

export const SharedChildSessionSidebar = ({
  shareId,
  onClose,
  isOpen,
}: SharedChildSessionSidebarProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const {
    data: sharedData,
    isLoading,
    error,
  } = useSharedSessionQuery({
    shareId,
    enabled: !!shareId && isOpen,
  })

  const session = sharedData?.share?.session
  const messages = sharedData?.share?.messages || []

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
      messages.length > 0 &&
      scrollContainerRef.current &&
      isAtBottomRef.current
    ) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-l border-border',
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
            {sharedData?.share?.title || session?.title || 'Shared Workspace'}
          </h3>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
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
              Loading shared workspace...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive text-sm text-center px-4">
              Failed to load workspace:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        ) : !session ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-sm">
              Shared workspace not found
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-sm">No messages yet</div>
          </div>
        ) : (
          messages.map((message: Message) => {
            if (message.role === 'user') {
              return (
                <UserMessage
                  key={message._id}
                  message={message}
                  session={session}
                />
              )
            } else if (message.role === 'assistant') {
              return (
                <OtherMessage
                  key={message._id}
                  message={message}
                  sessionId={session._id}
                />
              )
            } else if (
              (message.role === 'system' || message.role === 'eden') &&
              message.eden_message_data
            ) {
              return (
                <EdenMessage
                  key={message._id}
                  message={message}
                  agents={session.agents}
                />
              )
            } else if (message.role === 'system' || message.role === 'eden') {
              return <SystemMessage key={message._id} message={message} />
            }
            return null
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
