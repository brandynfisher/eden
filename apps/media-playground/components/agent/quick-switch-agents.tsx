'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { FC } from 'react'

interface QuickSwitchAgentsProps {
  currentAgentId?: string
  className?: string
}

export const QuickSwitchAgents: FC<QuickSwitchAgentsProps> = ({
  currentAgentId,
  className,
}) => {
  const { isSignedIn } = useAuthState()
  const { lastAgents, isLoading } = useUserPreferencesQuery({
    enabled: !!isSignedIn,
  })

  // Don't show if not signed in, loading, or no agents
  if (!isSignedIn || isLoading || lastAgents.length === 0) {
    return null
  }

  // Filter out the current agent from the list
  const otherAgents = lastAgents.filter(agent => agent._id !== currentAgentId)

  // Don't show if no other agents to switch to
  if (otherAgents.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {otherAgents.map(agent => (
        <Link
          key={agent._id}
          href={`/chat/${agent.username || agent._id}`}
          className="group relative"
          title={`Switch to ${agent.username || 'agent'}`}
        >
          <Avatar className="w-8 h-8 border-2 border-transparent hover:border-primary/50 transition-all cursor-pointer">
            <AvatarImage
              src={
                agent.userImage
                  ? getCloudfrontOriginalUrl(agent.userImage)
                  : undefined
              }
              alt={agent.username || 'Agent'}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-xs font-medium">
              {agent.username?.slice(0, 2).toUpperCase() || 'AG'}
            </AvatarFallback>
          </Avatar>
        </Link>
      ))}
    </div>
  )
}
