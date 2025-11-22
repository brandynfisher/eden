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
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'

type AgentAvatarsMenuProps = {
  agents: Agent[]
  children: ReactNode
}

export const AgentAvatarsMenu = ({
  agents,
  children,
}: AgentAvatarsMenuProps) => {
  const router = useRouter()
  const { user } = useAuthState()
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)

  const isSingleAgent = agents.length === 1
  const singleAgent = isSingleAgent ? agents[0] : null

  const handleViewProfile = (agentUsername: string) => {
    router.push(`/agents/${agentUsername}`)
  }

  const handleEditAgent = (agentUsername: string) => {
    setSettingsAgentId(agentUsername)
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
            {singleAgent.owner?._id === user?._id && (
              <DropdownMenuItem
                onClick={() =>
                  handleEditAgent(singleAgent.username || singleAgent._id)
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit agent
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
            onOpenChange={(open: boolean) => !open && setSettingsAgentId(null)}
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
            {agents.map(agent => {
              const isOwner = agent.owner?._id === user?._id
              return (
                <div
                  key={agent._id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md mx-1"
                >
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
                  <button
                    onClick={() =>
                      handleViewProfile(agent.username || agent._id)
                    }
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="text-sm font-medium truncate">
                      {agent.name || agent.username}
                    </div>
                    {agent.name &&
                      agent.username &&
                      agent.name !== agent.username && (
                        <div className="text-xs text-muted-foreground truncate">
                          @{agent.username}
                        </div>
                      )}
                  </button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleEditAgent(agent.username || agent._id)
                      }
                      className="h-7 w-7 shrink-0"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {settingsAgentId && (
        <AgentSettingsModal
          agentId={settingsAgentId}
          open={!!settingsAgentId}
          onOpenChange={(open: boolean) => !open && setSettingsAgentId(null)}
        />
      )}
    </>
  )
}
