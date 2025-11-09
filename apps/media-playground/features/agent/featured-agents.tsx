'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { env } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { GlobeIcon, MessageSquareIcon } from 'lucide-react'
import Link from 'next/link'

const featuredAgentIds =
  env.NEXT_PUBLIC_APP_ENV === 'production'
    ? ['abraham', 'solienne', 'verdelis']
    : [
        'eve',
        'abraham',
        'verdelis',
        'eden_gigabrain',
        'mechanical_duck',
        'hypotheticards',
      ]

export const FeaturedAgents = () => {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {featuredAgentIds.map(agentId => (
        <FeaturedAgentCard key={agentId} agentId={agentId} />
      ))}
    </div>
  )
}

const FeaturedAgentCard = ({ agentId }: { agentId: string }) => {
  const { agent, isLoading } = useAgentQuery({
    key: agentId,
    enabled: true,
  })

  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-lg" />
  }

  if (!agent) {
    return null
  }

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex gap-6">
        {/* Left column: Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-32 h-32 rounded-lg">
            <AvatarImage
              src={
                agent.userImage && agent.userImage.trim()
                  ? getCloudfrontOriginalUrl(agent.userImage)
                  : undefined
              }
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-3xl font-bold rounded-lg">
              {agent.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Right column: All text and buttons */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Name and Creator */}
          <div>
            <h3 className="font-bold text-2xl leading-tight truncate">
              {agent.name}
            </h3>
            <p className="text-base text-muted-foreground mt-1">
              By <span className="font-semibold">@{agent.owner.username}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            {/* Chat Button */}
            <Button size="default" variant="default" asChild className="gap-2">
              <Link href={`/chat/${agent.username}`}>
                <MessageSquareIcon className="w-4 h-4" />
                Chat
              </Link>
            </Button>

            {/* Website Button */}
            {agent.website && (
              <Button
                size="default"
                variant="outline"
                asChild
                className="gap-2"
              >
                <Link
                  href={agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  <GlobeIcon className="w-4 h-4" />
                  Website
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
