import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDownIcon, ChevronUpIcon, MessageCircleIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

interface InlineSessionCardProps {
  session: {
    _id: string
    title?: string
    createdAt: Date | string
    updatedAt?: Date | string
    agents?: Array<{
      _id: string
      username: string
      userImage?: string
      name?: string
    }>
    trigger?: unknown
  }
  hideAgentIds?: string[]
  linkPath?: string
  /** If provided, clicking will call this instead of navigating */
  onClick?: (sessionId: string) => void
  /** Whether to show the timestamp (default: true) */
  showTimestamp?: boolean
  /** Content preview to display below the title */
  contentPreview?: string
  /** Max characters for content preview before truncating (default: 500) */
  contentPreviewMaxLength?: number
}

/**
 * Compact inline session card for display in chat timeline tool results.
 * Shows single agent avatar (or chat bubble), title, and optionally time ago and content preview.
 */
const InlineSessionCard = ({
  session,
  hideAgentIds = [],
  linkPath,
  onClick,
  showTimestamp = true,
  contentPreview,
  contentPreviewMaxLength = 500,
}: InlineSessionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const displayTitle =
    session.title || (session.trigger ? 'Scheduled Task' : 'Untitled Session')
  const lastActivity = session.updatedAt || session.createdAt
  const timeAgo = formatDistanceToNow(new Date(lastActivity), {
    addSuffix: true,
    includeSeconds: false,
  }).replace(/^about /, '') // Remove "about" prefix

  // Filter agents, excluding hidden agents
  const visibleAgents =
    session.agents?.filter(agent => !hideAgentIds.includes(agent._id)) || []

  // Get first visible agent for avatar display
  const firstAgent = visibleAgents[0]

  // Use custom linkPath if provided, otherwise default to /sessions/{id}
  const href = linkPath || `/sessions/${session._id}`

  // Handle content preview truncation
  const needsTruncation =
    contentPreview && contentPreview.length > contentPreviewMaxLength
  const displayContent =
    contentPreview && needsTruncation && !isExpanded
      ? contentPreview.slice(0, contentPreviewMaxLength) + '...'
      : contentPreview

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const cardContent = (
    <div className="group bg-card hover:bg-card/80 border border-border hover:border-primary/40 rounded-lg px-4 py-3 transition-all duration-200 hover:shadow-sm cursor-pointer">
      <div className="flex items-center gap-4">
        {/* Single agent avatar or generic chat icon */}
        {firstAgent ? (
          <Avatar className="w-10 h-10 border border-border shrink-0">
            <AvatarImage
              src={
                firstAgent.userImage && firstAgent.userImage.trim()
                  ? getCloudfrontOriginalUrl(firstAgent.userImage)
                  : undefined
              }
              alt={firstAgent.name || firstAgent.username}
              className="object-cover"
            />
            <AvatarFallback className="text-sm">
              {(firstAgent.name || firstAgent.username)
                ?.slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <MessageCircleIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* Title and time */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-medium text-base line-clamp-1 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          {showTimestamp && (
            <p className="text-sm text-muted-foreground mt-0.5">{timeAgo}</p>
          )}
        </div>
      </div>

      {/* Content preview */}
      {displayContent && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {displayContent}
          </p>
          {needsTruncation && (
            <button
              type="button"
              onClick={handleExpandClick}
              className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-3 h-3" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )

  // If onClick is provided, use a button instead of Link
  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(session._id)}
        className="w-full text-left"
      >
        {cardContent}
      </button>
    )
  }

  return <Link href={href}>{cardContent}</Link>
}

export default InlineSessionCard
