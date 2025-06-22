import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import React from 'react'

interface SessionWelcomeProps {
  agents: Agent[]
  sessionTitle?: string
}

export const SessionWelcome: React.FC<SessionWelcomeProps> = ({
  agents,
  sessionTitle,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 h-full flex-1">
      <div className="flex -space-x-6 mb-6">
        {agents.slice(0, 8).map((agent, idx) => (
          <Avatar
            key={agent._id}
            className="h-20 w-20 border-4 border-background shadow-lg relative z-10"
            style={{ zIndex: agents.length - idx }}
          >
            <AvatarImage
              src={getCloudfrontOriginalUrl(agent.userImage)}
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="text-lg">
              {agent.name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="text-muted-foreground text-xl text-center">
        {sessionTitle || 'Untitled session'}
      </div>
    </div>
  )
}

export default SessionWelcome
