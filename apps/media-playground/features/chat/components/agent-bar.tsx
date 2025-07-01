'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import {
  ChevronRightIcon,
  ClockIcon,
  ImageIcon,
  MessageSquareIcon,
  SettingsIcon,
} from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import * as React from 'react'

// New Agent Bar component
export const AgentBar: FC<{
  agent: Agent | null | undefined
  isOwner: boolean
  onChatClick?: () => void
  onAgentSelect?: () => void
  viewMode: 'chat' | 'creations' | 'tasks' | 'settings'
  onViewModeChange: (mode: 'chat' | 'creations' | 'tasks' | 'settings') => void
}> = ({
  agent,
  isOwner,
  onChatClick,
  onAgentSelect,
  viewMode,
  onViewModeChange,
}) => {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      // Show icons only when container is narrow (less than ~600px for all 4 buttons)
      setIsNarrow(window.innerWidth < 600)
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const handleChatButtonClick = () => {
    if (viewMode !== 'chat') {
      // If we're not in chat mode, switch to chat mode
      onViewModeChange('chat')
    } else {
      // If we're in chat mode, trigger the chat action (new thread or open sidebar)
      onChatClick?.()
    }
  }

  return (
    <div className="bg-accent border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {agent ? (
          <button
            onClick={onAgentSelect}
            className="flex items-center gap-3 hover:bg-muted/10 rounded-lg px-2 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
          >
            <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <AvatarImage
                src={agent.userImage && agent.userImage.trim() ? getCloudfrontOriginalUrl(agent.userImage) : undefined}
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
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-4 h-4 ml-auto" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleChatButtonClick}
          className={`shrink-0 gap-1 text-sm ${
            viewMode === 'chat' &&
            'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
          }`}
        >
          <MessageSquareIcon className="size-4" />
          {!isNarrow && <span>Chat</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModeChange('creations')}
          className={`shrink-0 gap-1 text-sm ${
            viewMode === 'creations' &&
            'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
          }`}
        >
          <ImageIcon className="size-4" />
          {!isNarrow && <span>Creations</span>}
        </Button>
        {isOwner && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange('tasks')}
              className={`shrink-0 gap-1 text-sm ${
                viewMode === 'tasks' &&
                'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
              }`}
            >
              <ClockIcon className="size-4" />
              {!isNarrow && <span>Tasks</span>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewModeChange('settings')}
              className={`shrink-0 gap-1 text-sm ${
                viewMode === 'settings' &&
                'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
              }`}
            >
              <SettingsIcon className="size-4" />
              {!isNarrow && <span>Settings</span>}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
