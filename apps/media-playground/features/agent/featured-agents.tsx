'use client'

import AgentCard from '@/components/card/agent-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { env } from '@/lib/config'

const featuredAgentIds =
  env.NEXT_PUBLIC_APP_ENV === 'production'
    ? ['abraham', 'solienne', 'verdelis', 'eve', 'vjmaster', 'mechanical_duck']
    : [
        'eve',
        'eden_gigabrain',
        'abraham',
        'mycos',
        'hypotheticards',
        'invention-peddler',
      ]

export const FeaturedAgents = () => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {featuredAgentIds.map(agentId => (
        <FeaturedAgentWrapper key={agentId} agentId={agentId} />
      ))}
    </div>
  )
}

const FeaturedAgentWrapper = ({ agentId }: { agentId: string }) => {
  const { agent, isLoading } = useAgentQuery({
    key: agentId,
    enabled: true,
  })

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full rounded-xl" />
  }

  if (!agent) {
    return null
  }

  return <AgentCard agent={agent} improvedLayout hideContextMenu />
}
