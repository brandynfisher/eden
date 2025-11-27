'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { BrainCircuitIcon } from 'lucide-react'
import { useState } from 'react'

interface AgentWorkspacesProps {
  agents: Agent[]
  /** Maps agent IDs to their workspace session IDs */
  agentSessions?: Record<string, string>
  onOpenWorkspace: (sessionId: string) => void
  className?: string
}

export const AgentWorkspaces = ({
  agents,
  agentSessions,
  onOpenWorkspace,
  className,
}: AgentWorkspacesProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Only show if we have agent sessions
  if (!agentSessions || Object.keys(agentSessions).length === 0) {
    return null
  }

  // Filter agents that have workspaces
  const agentsWithWorkspaces = agents.filter(agent => agentSessions[agent._id])

  if (agentsWithWorkspaces.length === 0) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-primary/10 hover:bg-primary/20 border border-primary/20',
            'text-sm font-medium text-primary transition-all duration-200',
            'shadow-sm hover:shadow-md',
            className,
          )}
        >
          <BrainCircuitIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Agent Workspaces</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" sideOffset={8}>
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Agent Workspaces
          </div>
          {agentsWithWorkspaces.map(agent => {
            const workspaceSessionId = agentSessions[agent._id]
            if (!workspaceSessionId) return null

            return (
              <button
                key={agent._id}
                onClick={() => {
                  onOpenWorkspace(workspaceSessionId)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg',
                  'hover:bg-muted transition-colors text-left',
                )}
              >
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage
                    src={
                      agent.userImage
                        ? getCloudfrontUrl(agent.userImage)
                        : undefined
                    }
                    alt={agent.name || agent.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {(agent.name || agent.username)?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {agent.name || agent.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    View workspace
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
