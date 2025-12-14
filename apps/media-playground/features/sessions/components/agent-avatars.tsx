import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { FC } from 'react'

interface AgentAvatarsProps {
  agents: Array<{
    _id: string
    userImage?: string
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

  // Helper function to calculate circular positions
  const getCircularPosition = (
    index: number,
    total: number,
    containerSize: number,
    avatarSize: number,
    radius: number,
  ) => {
    let angle: number

    if (total === 2) {
      // Diagonal: top-left and bottom-right
      angle = index === 0 ? -Math.PI / 4 : (3 * Math.PI) / 4
    } else if (total === 3) {
      // Triangle: top, bottom-right, bottom-left (clockwise)
      const startAngle = -Math.PI / 2 // Start from top
      angle = startAngle + (index * 2 * Math.PI) / 3
    } else {
      // 4+ agents: Cross pattern starting from top (clockwise)
      const startAngle = -Math.PI / 2 // Start from top, same as 3
      angle = startAngle + (index * Math.PI) / 2
    }

    const centerX = containerSize / 2
    const centerY = containerSize / 2
    const x = centerX + radius * Math.cos(angle) - avatarSize / 2
    const y = centerY + radius * Math.sin(angle) - avatarSize / 2

    return { x, y }
  }

  // For 2-4+ agents: show avatars in circular pattern
  const displayCount = Math.min(totalAgents, 4)
  const displayAgents = agents.slice(0, displayCount)
  const containerSize = 32 // w-8 h-8 = 32px
  const avatarSize = totalAgents === 2 ? 24 : totalAgents === 3 ? 22 : 21 // h-6 for 2, 22px for 3, 21px for 4
  const radius = totalAgents === 2 ? 5 : totalAgents === 3 ? 8 : 8

  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative w-8 h-8 flex-shrink-0">
        {displayAgents.map((agent, index) => {
          const { x, y } = getCircularPosition(
            index,
            displayCount,
            containerSize,
            avatarSize,
            radius,
          )

          return (
            <div
              key={agent._id}
              className={cn(
                'absolute rounded-full bg-muted border border-background overflow-hidden',
                avatarSize === 24 ? 'h-6 w-6' : '',
              )}
              style={{
                top: `${y}px`,
                left: `${x}px`,
                width: avatarSize !== 24 ? `${avatarSize}px` : undefined,
                height: avatarSize !== 24 ? `${avatarSize}px` : undefined,
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
