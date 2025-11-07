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
    session_type?: 'chat' | 'passive' | 'automatic'
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
      : session.session_type === 'passive'
      ? 'Passive'
      : 'Chat'

  return (
    <Link href={href}>
      <div className="group relative bg-card hover:bg-card/80 border border-border hover:border-primary/40 rounded-lg p-6 transition-all duration-200 hover:shadow-md cursor-pointer min-h-[280px] flex flex-col">
        {/* Header with title and session type */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors flex-1">
              {displayTitle}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              {sessionTypeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Agents section */}
        {visibleAgents.length > 0 && (
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-3 text-sm text-muted-foreground">
              <UsersIcon className="w-4 h-4" />
              <span className="font-medium">
                {visibleAgents.length} Agent
                {visibleAgents.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleAgents.slice(0, 4).map(agent => (
                <div
                  key={agent._id}
                  className="flex items-center gap-2 bg-muted/50 rounded-full px-2.5 py-1.5 text-sm"
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
                  <span className="text-foreground font-medium truncate max-w-[100px]">
                    {agent.name || agent.username}
                  </span>
                </div>
              ))}
              {visibleAgents.length > 4 && (
                <div className="flex items-center justify-center bg-muted/50 rounded-full px-3 py-1.5 text-sm text-muted-foreground">
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
