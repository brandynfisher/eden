'use client'

import AgentCard from '@/components/card/agent-card'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import { Loader2 } from 'lucide-react'
import { FC } from 'react'

export const SharedAgentsSection: FC = () => {
  const { sharedAgents, isLoading } = useSharedAgentsQuery({})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (sharedAgents.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Shared with Me</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Agents you have permission to edit or manage
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {sharedAgents.map(({ agent }) => (
          <AgentCard
            key={agent._id}
            agent={agent}
            queryKey={['agents', agent._id]}
            improvedLayout={true}
          />
        ))}
      </div>
    </div>
  )
}
