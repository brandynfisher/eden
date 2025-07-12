'use client'

import { ViewMode } from '../types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import * as React from 'react'

// New Agent Bar component
export const AgentBar: FC<{
  agent: Agent | null | undefined
  onChatClick?: () => void
  onAgentSelect?: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  agentId?: string
  onAgentInvalidate?: () => Promise<void>
  isSidebarCollapsed?: boolean
}> = ({
  agent,
  onChatClick,
  onAgentSelect,
  viewMode,
  onViewModeChange,
  isSidebarCollapsed,
}) => {
  const [isMobile, setIsMobile] = useState(false)
  useAuthState()
  const params = useParams()
  const sessionId = params.id as string

  // Get current session data
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

  useEffect(() => {
    const checkWidth = () => {
      // Check if we're on mobile (less than 768px for md breakpoint)
      setIsMobile(window.innerWidth < 768)
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const handleSessionTitleClick = () => {
    // Only open sidebar if:
    // 1. We're on mobile (sidebar is never visible on mobile), OR
    // 2. We're on desktop but sidebar is collapsed
    if (isMobile || isSidebarCollapsed) {
      if (viewMode !== 'chat') {
        // If we're not in chat mode, switch to chat mode
        onViewModeChange('chat')
      } else {
        // If we're in chat mode, trigger the chat action (open sidebar)
        onChatClick?.()
      }
    }
    // If we're on desktop and sidebar is visible, do nothing
  }

  return (
    <div className="bg-accent border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {agent ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Hamburger menu - only show when sidebar is invisible */}
            {(isMobile || isSidebarCollapsed) && (
              <button
                onClick={handleSessionTitleClick}
                className="p-2 hover:bg-muted/10 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <MenuIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onAgentSelect}
              className="flex items-center gap-3 hover:bg-muted/10 rounded-lg px-2 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <AvatarImage
                  src={
                    agent.userImage && agent.userImage.trim()
                      ? getCloudfrontOriginalUrl(agent.userImage)
                      : undefined
                  }
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-sm font-medium">
                  {agent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-base text-foreground truncate max-w-[200px]">
                {agent.name}
              </span>
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
            {/* Session title - only show when in an active chat */}
            {sessionId && session?.title && (
              <button
                onClick={handleSessionTitleClick}
                className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors"
                title={session.title}
              >
                {session.title}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-4 h-4 ml-auto" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Chat button removed - functionality moved to session title area */}
      </div>
    </div>
  )
}
