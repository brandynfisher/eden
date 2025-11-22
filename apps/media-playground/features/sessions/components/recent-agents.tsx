'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import {
  usePinAgent,
  useUnpinAgent,
} from '@/hooks/mutation/use-agent-preferences'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { MinimalAgent } from '@edenlabs/eden-sdk'
import {
  ChevronRightIcon,
  MoreHorizontal,
  PinIcon,
  PinOffIcon,
  SettingsIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { FC, useMemo, useState } from 'react'

interface AgentListItemProps {
  agent: MinimalAgent
  currentUserId?: string
  isPinned: boolean
  onItemClick?: () => void
  onPin?: () => void
  onUnpin?: () => void
  onSettingsOpen?: () => void
}

const AgentListItem: FC<AgentListItemProps> = ({
  agent,
  currentUserId,
  isPinned,
  onItemClick,
  onPin,
  onUnpin,
  onSettingsOpen,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const { hasEditAccess, isLoading: isPermissionsLoading } =
    useAgentPermissions(agent, currentUserId)

  // Only highlight if on agent's home screen, not on a specific session
  const agentPath = `/chat/${agent.username || agent._id}`
  const isActive = pathname === agentPath

  const handleAgentClick = () => {
    onItemClick?.()
    router.push(`/chat?agent=${agent.username || agent._id}`)
  }

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSettingsOpen?.()
  }

  return (
    <div
      className={cn(
        'group flex justify-between items-center gap-2 rounded-md transition-all mr-1 text-[15px] relative px-1.5 py-1.5 border w-full',
        isActive
          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground font-medium'
          : 'hover:text-foreground hover:bg-muted/50 border-transparent',
      )}
    >
      <button
        onClick={handleAgentClick}
        className="flex items-center gap-2.5 min-w-0 flex-1"
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={getCloudfrontOriginalUrl(agent.userImage)}
            alt={agent.name || agent.username}
          />
          <AvatarFallback>
            {(agent.name || agent.username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-normal">
          {agent.name || agent.username}
        </span>
      </button>

      <div className="flex items-center gap-1 shrink-0 opacity-100">
        {hasEditAccess && !isPermissionsLoading && (
          <button
            onClick={handleSettingsClick}
            className="p-1.5 hover:bg-muted/80 rounded transition-colors"
            title="Agent settings"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 hover:bg-muted/80 rounded transition-colors"
              title="More options"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPinned ? (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onUnpin?.()
                }}
              >
                <PinOffIcon className="mr-2 h-4 w-4" />
                Unpin
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onPin?.()
                }}
              >
                <PinIcon className="mr-2 h-4 w-4" />
                Pin
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export const RecentAgents = ({ onItemClick }: { onItemClick?: () => void }) => {
  const { isSignedIn, user } = useAuthState()
  const { lastAgents, pinnedAgents, isLoading } = useUserPreferencesQuery({
    enabled: !!isSignedIn,
  })
  const { mutate: pinAgent } = usePinAgent()
  const { mutate: unpinAgent } = useUnpinAgent()
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(false)

  const displayAgents = useMemo(() => {
    const pinnedAgentIds = new Set(pinnedAgents.map(a => a._id))
    return [
      ...pinnedAgents.map(agent => ({ ...agent, isPinned: true })),
      ...lastAgents
        .filter(agent => !pinnedAgentIds.has(agent._id))
        .map(agent => ({ ...agent, isPinned: false })),
    ].slice(0, 3)
  }, [lastAgents, pinnedAgents])

  if (!isSignedIn || isLoading || displayAgents.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex flex-col text-sm font-medium mb-3 mr-2">
        <button
          onClick={() => setIsAgentsCollapsed(!isAgentsCollapsed)}
          className="pb-1 mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRightIcon
            className={cn(
              'h-3 w-3 transition-transform',
              !isAgentsCollapsed && 'rotate-90',
            )}
          />
          Agents
        </button>

        {!isAgentsCollapsed && (
          <nav className="flex flex-col items-stretch gap-1">
            {displayAgents.map(agent => {
              return (
                <AgentListItem
                  key={agent._id}
                  agent={agent}
                  currentUserId={user?._id}
                  isPinned={agent.isPinned}
                  onItemClick={onItemClick}
                  onPin={() => pinAgent(agent._id)}
                  onUnpin={() => unpinAgent(agent._id)}
                  onSettingsOpen={() => {
                    setSettingsAgentId(agent.username || agent._id)
                    setIsSettingsModalOpen(true)
                  }}
                />
              )
            })}
          </nav>
        )}
      </div>

      {settingsAgentId && (
        <AgentSettingsModal
          agentId={settingsAgentId}
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          initialTab="profile"
        />
      )}
    </>
  )
}
