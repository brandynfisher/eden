import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import Link from 'next/link'

export interface AgentPopoverAgent {
  _id: string
  username: string
  userImage?: string
  name?: string
}

interface AgentPopoverContentProps {
  agents: AgentPopoverAgent[]
  title?: string
  onAgentClick?: () => void
}

const AgentPopoverContent = ({
  agents,
  title = `Agents in Session (${agents.length})`,
  onAgentClick,
}: AgentPopoverContentProps) => {
  return (
    <div className="grid grid-cols-1 gap-2 min-w-48">
      <div className="text-sm font-medium mb-2">{title}</div>
      {agents.map(agent => (
        <Link
          key={agent._id}
          href={`/chat/${agent.username}`}
          className="flex items-center space-x-3 hover:bg-muted/50 rounded-lg p-2 transition-colors"
          onClick={onAgentClick}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getCloudfrontOriginalUrl(agent.userImage)}
              alt={agent.name || agent.username}
              className="object-cover"
            />
            <AvatarFallback className="text-sm">
              {agent.name?.[0]?.toUpperCase() ||
                agent.username?.[0]?.toUpperCase() ||
                'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {agent.name || agent.username}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              @{agent.username}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default AgentPopoverContent
