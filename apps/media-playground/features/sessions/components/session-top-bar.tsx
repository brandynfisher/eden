'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SessionBudget } from '@/features/sessions/components/session-budget'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent, Message } from '@edenlabs/eden-sdk'
import { UsersIcon } from 'lucide-react'
import Link from 'next/link'

interface SessionTopBarProps {
  agents: Agent[]
  title?: string
  className?: string
  sessionBudget?: {
    token_budget?: number
    manna_budget?: number
    turn_budget?: number
    tokens_spent?: number
    manna_spent?: number
    turns_spent?: number
  }
  // New props for sharing
  sessionId?: string
  messages?: Message[]
  isOwner?: boolean
  isPublic?: boolean
}

export const SessionTopBar = ({
  agents,
  title,
  className,
  sessionBudget,
  sessionId,
  messages,
  isOwner,
  isPublic,
}: SessionTopBarProps) => {
  const AgentsPopoverContent = ({ agents }: { agents: Agent[] }) => (
    <div className="grid grid-cols-1 gap-2 min-w-48">
      <div className="text-sm font-medium mb-2">
        Agents in Session ({agents.length})
      </div>
      {agents.map(agent => (
        <Link
          key={agent._id}
          href={`/chat/${agent.username}`}
          className="flex items-center space-x-3 hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getCloudfrontOriginalUrl(agent.userImage)}
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="text-sm">
              {agent.name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{agent.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              @{agent.username}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  return (
    <div
      className={cn(
        'sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Session title only */}
        <div className="flex-1 min-w-0">
          {title ? (
            <div className="text-sm font-medium text-foreground truncate">
              {title}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Session</div>
          )}
        </div>

        {/* Right side - Share button, Session budget, and Agents popover trigger */}
        {sessionId && messages && isOwner && (
          <SessionShareButton
            sessionId={sessionId}
            messages={messages}
            isOwner={isOwner}
            isPublic={isPublic}
            className="mr-2"
          />
        )}
        {sessionBudget && (
          <div className="mx-1">
            <SessionBudget budget={sessionBudget} />
          </div>
        )}
        <div className="flex-shrink-0 ">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 px-3 py-2 h-auto"
              >
                <UsersIcon className="h-4 w-4" />
                <span className="text-sm">
                  {agents.length} Agent{agents.length !== 1 ? 's' : ''}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <AgentsPopoverContent agents={agents} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
