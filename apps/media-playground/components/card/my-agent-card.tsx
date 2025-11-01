'use client'

import PrivateIcon from '@/components/icons/private-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { MessageSquareIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  agent: Agent
  userId: string
  className?: string
}

const MyAgentCard = ({ agent, userId, className }: Props) => {
  // Fetch recent sessions for this agent (backend expects username, not _id)
  const { sessions, isLoading: isLoadingSessions } = useSessionListQuery({
    enabled: !!userId,
    agent_id: agent.username,
  })

  // Get the 3 most recent sessions (already sorted by updatedAt in the query)
  const recentSessions = React.useMemo(() => {
    return sessions.filter(session => session != null).slice(0, 3)
  }, [sessions])

  return (
    <Card
      className={cn([
        'relative overflow-hidden border-2 border-border/60 transition-all group bg-card/80 h-full w-full max-w-full hover:shadow-lg hover:border-border/80',
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon className="" /> : null}

      {/* Settings icon - top right */}
      <button
        className="absolute top-3 right-3 z-10 p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors"
        title="Settings"
        onClick={e => {
          e.preventDefault()
          // TODO: Add settings link/action
        }}
      >
        <SettingsIcon className="w-4 h-4 text-muted-foreground" />
      </button>

      <Link
        href={`/chat/${agent.username}`}
        prefetch={false}
        className="block w-full"
      >
        <div className="flex flex-col p-6 gap-4 h-full min-h-[320px] w-full max-w-full overflow-hidden">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage
                  src={
                    agent.userImage && agent.userImage.trim()
                      ? getCloudfrontOriginalUrl(agent.userImage)
                      : undefined
                  }
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-2xl font-medium">
                  {agent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* Name */}
              <h3 className="font-semibold text-xl leading-tight">
                {agent.name}
              </h3>

              {/* Description - limited to 2 lines */}
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {agent.description}
              </p>

              {/* Message count */}
              <div className="flex items-center gap-1.5 mt-1">
                <MessageSquareIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground font-medium">
                  {formatCompactNumber(agent.stats?.userMessageCount || 0)}{' '}
                  messages
                </span>
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent Sessions
            </div>

            <div className="flex flex-col gap-1.5">
              {isLoadingSessions ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </>
              ) : recentSessions.length > 0 ? (
                recentSessions.map(session => {
                  if (!session) return null
                  return (
                    <Link
                      key={session._id}
                      href={`/sessions/${session._id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors text-sm group/session"
                      onClick={e => e.stopPropagation()}
                    >
                      <MessageSquareIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-muted-foreground group-hover/session:text-foreground transition-colors">
                        {session.title || 'Untitled Session'}
                      </span>
                    </Link>
                  )
                })
              ) : (
                <div className="text-sm text-muted-foreground italic py-2">
                  No recent sessions
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

export default MyAgentCard
