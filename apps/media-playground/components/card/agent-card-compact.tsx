'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { CheckIcon, MessageSquareIcon } from 'lucide-react'

type Props = {
  agent: Agent
  onClick?: (agent: Agent) => void
  isSelected?: boolean
  className?: string
}

const AgentCardCompact = ({ agent, onClick, isSelected, className }: Props) => {
  const imageSrc =
    agent.userImage && agent.userImage.trim()
      ? getCloudfrontOriginalUrl(agent.userImage)
      : undefined
  const description = agent.description || 'No description provided.'
  const messageCount = agent.stats?.messageCount || 0

  return (
    <div
      className={cn(
        'group flex flex-row rounded-lg border bg-card cursor-pointer relative',
        'border-border/60 hover:border-primary/50 hover:bg-accent/50',
        'transition-all duration-150 overflow-hidden p-3 gap-3 h-full',
        isSelected && ['border-primary bg-primary/5', 'ring-1 ring-primary/50'],
        className,
      )}
      onClick={() => onClick?.(agent)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(agent)
        }
      }}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
          <CheckIcon className="h-3 w-3" />
        </div>
      )}

      {/* Avatar - full height */}
      <div className="shrink-0 flex items-center">
        <Avatar className="w-[94px] h-[94px] rounded-md">
          <AvatarImage
            src={imageSrc}
            alt={agent.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-2xl font-semibold rounded-md">
            {agent.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1 py-0.5">
        <h3 className="font-semibold text-base leading-tight truncate">
          {agent.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          by @{agent.owner?.username || agent.username}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed min-h-[2.5em]">
          {description}
        </p>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-auto pt-1">
          <MessageSquareIcon className="h-3 w-3" />
          {formatCompactNumber(messageCount)}
        </span>
      </div>
    </div>
  )
}

export default AgentCardCompact
