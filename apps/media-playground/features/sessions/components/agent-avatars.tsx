import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { FC } from 'react'

interface AgentAvatarsProps {
  agents: Array<{
    _id: string
    userImage: string
    username: string
    name?: string
  }>
  className?: string
}

export const AgentAvatars: FC<AgentAvatarsProps> = ({ agents, className }) => {
  const totalAgents = agents.length

  // Discord-style logic
  if (totalAgents === 0) {
    return null
  }

  if (totalAgents === 1) {
    // Single large avatar
    const agent = agents[0]
    return (
      <div className={cn('flex items-center', className)}>
        <div className="relative rounded-full bg-muted border border-background overflow-hidden flex-shrink-0 h-8 w-8">
          {agent.userImage ? (
            <img
              src={getCloudfrontOriginalUrl(agent.userImage)}
              alt={agent.name || agent.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="font-medium text-white text-xs">
                {(agent.name || agent.username || '?')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (totalAgents >= 4) {
    // Show "x Members" text for many agents
    return (
      <div className={cn('flex items-center', className)}>
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Background circle stack effect */}
          <div className="absolute inset-0 rounded-full bg-muted/30 border border-background/50" />
          <div className="absolute inset-0.5 rounded-full bg-muted/50 border border-background/50" />
          <div className="absolute inset-1 rounded-full bg-muted border border-background overflow-hidden">
            {agents[0].userImage ? (
              <img
                src={getCloudfrontOriginalUrl(agents[0].userImage)}
                alt={agents[0].name || agents[0].username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="font-medium text-white text-[8px]">
                  {(agents[0].name ||
                    agents[0].username ||
                    '?')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
        <span className="ml-2 text-xs text-muted-foreground font-medium">
          {totalAgents} Members
        </span>
      </div>
    )
  }

  // 2-3 agents: diagonal overlapping circles
  const displayAgents = agents.slice(0, 3)

  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative w-8 h-8 flex-shrink-0">
        {displayAgents.map((agent, index) => {
          const positions = [
            { top: '0px', left: '0px', size: 'h-5 w-5' }, // Top-left
            { top: '12px', left: '12px', size: 'h-5 w-5' }, // Bottom-right
            { top: '6px', left: '6px', size: 'h-4 w-4' }, // Center (for 3rd agent)
          ]

          const position = positions[index]

          return (
            <div
              key={agent._id}
              className={cn(
                'absolute rounded-full bg-muted border border-background overflow-hidden',
                position.size,
              )}
              style={{
                top: position.top,
                left: position.left,
                zIndex: 10 - index,
              }}
            >
              {agent.userImage ? (
                <img
                  src={getCloudfrontOriginalUrl(agent.userImage)}
                  alt={agent.name || agent.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="font-medium text-white text-[8px]">
                    {(agent.name || agent.username || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
