import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatDistanceToNow } from 'date-fns'
import { ClockIcon, MessageCircleIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'

interface SessionCardProps {
  session: {
    _id: string
    title?: string
    createdAt: Date | string
    updatedAt?: Date | string
    session_type?: 'passive' | 'natural' | 'automatic'
    platform?: 'discord' | 'telegram' | 'twitter' | 'farcaster'
    agents?: Array<{
      _id: string
      username: string
      userImage?: string
      name?: string
    }>
    owner?: {
      username?: string
      userImage?: string
    }
    trigger?: unknown
    messageCount?: number
  }
  hideAgentIds?: string[]
  linkPath?: string
}

const PlatformIcon = ({
  platform,
}: {
  platform: 'discord' | 'telegram' | 'twitter' | 'farcaster'
}) => {
  switch (platform) {
    case 'discord':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#5865F2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg
          className="h-3.5 w-3.5 text-foreground shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'farcaster':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#8A63D2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 4h18v16.5h-2.25v-1.5H5.25v1.5H3V4zm2.25 2.25v9.75h13.5V6.25H5.25zm3 2.25h7.5v1.5h-7.5v-1.5zm0 3h7.5v1.5h-7.5v-1.5z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg
          className="h-3.5 w-3.5 text-[#0088cc] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    default:
      return null
  }
}

const SessionCard = ({
  session,
  hideAgentIds = [],
  linkPath,
}: SessionCardProps) => {
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

  // Use custom linkPath if provided, otherwise default to /sessions/{id}
  const href = linkPath || `/sessions/${session._id}`

  // Get session type label
  const sessionTypeLabel =
    session.session_type === 'automatic'
      ? 'Automatic'
      : session.session_type === 'natural'
      ? 'Natural'
      : 'Passive'

  return (
    <Link href={href}>
      <div className="group relative bg-card hover:bg-card/80 border border-border hover:border-primary/40 rounded-lg p-4 md:p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col min-h-[200px]">
        {/* Header with title and session type */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-base sm:text-lg leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors flex-1">
              {displayTitle}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {session.platform && (
                <span className="flex items-center justify-center rounded-full border border-border bg-muted/40 p-1">
                  <PlatformIcon platform={session.platform} />
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {sessionTypeLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Agents section */}
        {visibleAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-sm text-muted-foreground">
              <UsersIcon className="w-4 h-4" />
              <span className="font-medium">Participants:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[56px] overflow-hidden">
              {visibleAgents.slice(0, 4).map(agent => (
                <div
                  key={agent._id}
                  className="flex items-center gap-2 bg-muted/50 rounded-full px-2.5 py-1 text-sm"
                >
                  <Avatar className="w-5 h-5 border border-border">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name || agent.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs">
                      {(agent.name || agent.username)
                        ?.slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground font-medium truncate max-w-[96px]">
                    {agent.name || agent.username}
                  </span>
                </div>
              ))}
              {visibleAgents.length > 4 && (
                <div className="flex items-center justify-center bg-muted/50 rounded-full px-3 py-1 text-sm text-muted-foreground">
                  +{visibleAgents.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}

        {visibleAgents.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageCircleIcon className="w-4 h-4" />
            <span>No agents</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
      </div>
    </Link>
  )
}

export default SessionCard
