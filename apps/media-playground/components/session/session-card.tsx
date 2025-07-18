import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatDistanceToNow } from 'date-fns'
import { ClockIcon, MessageCircleIcon } from 'lucide-react'
import Image from 'next/image'
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
}

const SessionCard = ({ session }: SessionCardProps) => {
  const displayTitle =
    session.title || (session.trigger ? 'Scheduled Task' : 'Untitled Session')
  const lastActivity = session.updatedAt || session.createdAt
  const timeAgo = formatDistanceToNow(new Date(lastActivity), {
    addSuffix: true,
    includeSeconds: false,
  }).replace(/^about /, '') // Remove "about" prefix

  // Filter agents with userImage for AgentAvatars component
  const agentsWithImages =
    session.agents?.filter(
      (agent): agent is typeof agent & { userImage: string } =>
        !!agent.userImage,
    ) || []

  return (
    <Link href={`/sessions/${session._id}`}>
      <div className="group relative bg-card hover:bg-card/80 border border-border hover:border-primary/40 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer">
        {/* Header with agent avatars */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {agentsWithImages.length > 0 ? (
              <AgentAvatars agents={agentsWithImages} className="shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <MessageCircleIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {/* Owner avatar in top right if different from agents */}
            {session.owner?.userImage && (
              <div className="ml-auto shrink-0">
                <Image
                  src={getCloudfrontOriginalUrl(session.owner.userImage)}
                  alt={session.owner.username || 'Owner'}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border border-border object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Session title */}
        <div className="mb-2">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
        </div>

        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>

          {!!session.trigger && (
            <div className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
              Scheduled
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
      </div>
    </Link>
  )
}

export default SessionCard
