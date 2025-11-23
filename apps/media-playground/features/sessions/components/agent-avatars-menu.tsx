'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { BrainIcon, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'

type AgentAvatarsMenuProps = {
  agents: Agent[]
  children: ReactNode
}

// Sub-component for agent item that can use the permission hook
const AgentMenuItem = ({
  agent,
  userId,
  onViewProfile,
  onEditAgent,
  onViewMemories,
}: {
  agent: Agent
  userId?: string
  onViewProfile: () => void
  onEditAgent: () => void
  onViewMemories: () => void
}) => {
  const { hasEditAccess } = useAgentPermissions(agent, userId)

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md mx-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={getCloudfrontOriginalUrl(agent.userImage)}
          alt={agent.name || agent.username}
          className="object-cover"
        />
        <AvatarFallback className="text-xs">
          {agent.name?.[0]?.toUpperCase() ||
            agent.username?.[0]?.toUpperCase() ||
            'A'}
        </AvatarFallback>
      </Avatar>
      <button onClick={onViewProfile} className="flex-1 min-w-0 text-left">
        <div className="text-sm font-medium truncate">
          {agent.name || agent.username}
        </div>
        {agent.name && agent.username && agent.name !== agent.username && (
          <div className="text-xs text-muted-foreground truncate">
            @{agent.username}
          </div>
        )}
      </button>
      {hasEditAccess ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditAgent}
          className="h-7 w-7 shrink-0"
          title="Agent settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onViewMemories}
          className="h-7 w-7 shrink-0"
          title="View memories"
        >
          <BrainIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

export const AgentAvatarsMenu = ({
  agents,
  children,
}: AgentAvatarsMenuProps) => {
  const router = useRouter()
  const { user } = useAuthState()
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [isMemoriesOnly, setIsMemoriesOnly] = useState(false)

  const isSingleAgent = agents.length === 1
  const singleAgent = isSingleAgent ? agents[0] : null

  // Permission check for single agent case
  const { hasEditAccess: singleAgentHasEditAccess } = useAgentPermissions(
    singleAgent,
    user?._id,
  )

  const handleViewProfile = (agentUsername: string) => {
    router.push(`/agents/${agentUsername}`)
  }

  const handleEditAgent = (agentUsername: string, memoriesOnly = false) => {
    setSettingsAgentId(agentUsername)
    setIsMemoriesOnly(memoriesOnly)
  }

  if (isSingleAgent && singleAgent) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5 text-sm font-medium">
              {singleAgent.name || singleAgent.username}
            </div>
            <DropdownMenuSeparator />
            {singleAgentHasEditAccess ? (
              <DropdownMenuItem
                onClick={() =>
                  handleEditAgent(singleAgent.username || singleAgent._id)
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit agent
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  handleEditAgent(singleAgent.username || singleAgent._id, true)
                }
              >
                <BrainIcon className="mr-2 h-4 w-4" />
                View memories
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                handleViewProfile(singleAgent.username || singleAgent._id)
              }
            >
              <User className="mr-2 h-4 w-4" />
              View profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {settingsAgentId && (
          <AgentSettingsModal
            agentId={settingsAgentId}
            open={!!settingsAgentId}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setSettingsAgentId(null)
                setIsMemoriesOnly(false)
              }
            }}
            initialTab={isMemoriesOnly ? 'memories' : 'profile'}
            memoriesOnly={isMemoriesOnly}
          />
        )}
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Agents in Session ({agents.length})
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto">
            {agents.map(agent => (
              <AgentMenuItem
                key={agent._id}
                agent={agent}
                userId={user?._id}
                onViewProfile={() =>
                  handleViewProfile(agent.username || agent._id)
                }
                onEditAgent={() => handleEditAgent(agent.username || agent._id)}
                onViewMemories={() =>
                  handleEditAgent(agent.username || agent._id, true)
                }
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {settingsAgentId && (
        <AgentSettingsModal
          agentId={settingsAgentId}
          open={!!settingsAgentId}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSettingsAgentId(null)
              setIsMemoriesOnly(false)
            }
          }}
          initialTab={isMemoriesOnly ? 'memories' : 'profile'}
          memoriesOnly={isMemoriesOnly}
        />
      )}
    </>
  )
}
