'use client'

import PrivateIcon from '@/components/icons/private-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { BarChart3Icon, MessageSquareIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'

type Props = {
  agent: Agent
  userId: string
  className?: string
  onSettingsClick?: () => void
  onDashboardClick?: () => void
}

const MyAgentCard = ({
  agent,
  userId,
  className,
  onSettingsClick,
  onDashboardClick,
}: Props) => {
  const { hasEditAccess, isLoading: isPermissionsLoading } =
    useAgentPermissions(agent, userId)

  return (
    <Card
      className={cn([
        'relative overflow-hidden border-2 border-border/60 transition-all group bg-card/80 h-full w-full max-w-full hover:shadow-lg hover:border-primary/60',
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon className="" /> : null}

      {/* Action buttons - top right */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {/* Dashboard button */}
        <button
          className="p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors"
          title="Dashboard"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            onDashboardClick?.()
          }}
        >
          <BarChart3Icon className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Settings button */}
        {hasEditAccess && !isPermissionsLoading && (
          <button
            className="p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors"
            title="Settings"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onSettingsClick?.()
            }}
          >
            <SettingsIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

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
                  {formatCompactNumber(agent.stats?.messageCount || 0)} messages
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

export default MyAgentCard
