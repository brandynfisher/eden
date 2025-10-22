import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { formatDistanceToNow } from 'date-fns'
import { ClockIcon, MessageCircleIcon } from 'lucide-react'
import Link from 'next/link'

interface SessionCardProps {
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

  // Filter agents with userImage for AgentAvatars component, excluding hidden agents
  const agentsWithImages =
    session.agents?.filter(
      (agent): agent is typeof agent & { userImage: string } =>
        !!agent.userImage && !hideAgentIds.includes(agent._id),
    ) || []

  // Use custom linkPath if provided, otherwise default to /sessions/{id}
  const href = linkPath || `/sessions/${session._id}`

  return (
    <Link href={href}>
      <div className="group relative bg-card hover:bg-card/80 border border-border hover:border-primary/40 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer">
        {/* Header with agent avatars, title, and timestamp */}
        <div className="flex items-start gap-3 mb-2">
          {/* Agent avatars on the left */}
          {agentsWithImages.length > 0 ? (
            <AgentAvatars agents={agentsWithImages} className="shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <MessageCircleIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Title and timestamp */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {displayTitle}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ClockIcon className="w-3.5 h-3.5" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
      </div>
    </Link>
  )
}

export default SessionCard
