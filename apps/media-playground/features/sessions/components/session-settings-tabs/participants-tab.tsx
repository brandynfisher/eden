'use client'

import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { MAX_AGENTS } from '@/features/sessions/session-config'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  Agent,
  FeatureFlag,
  SessionPermission,
  SessionPermissionLevel,
} from '@edenlabs/eden-sdk'
import {
  EyeIcon,
  Loader2,
  MessageSquareIcon,
  Plus,
  ShieldIcon,
  UserIcon,
  X,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type PermissionLevelOption = 'owner' | 'editor' | 'participant' | 'viewer'

type ParticipantsTabProps = {
  agents: Agent[]
  onAgentsChange: (agents: Agent[]) => void
  permissions: SessionPermission[]
  onPermissionsChange: (permissions: SessionPermission[]) => void
  sessionId?: string
  isPermissionsLoading: boolean
  isSavingPermissions: boolean
}

// Agent card similar to SelectedAgentCard in chat-launchpad
const AgentCard = ({
  agent,
  canRemove,
  onRemove,
  onSelect,
}: {
  agent: Agent
  canRemove: boolean
  onRemove: (agentId: string) => void
  onSelect: (agent: Agent) => void
}) => {
  return (
    <div
      className="group relative flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onSelect(agent)}
    >
      {/* Remove button */}
      {canRemove && (
        <button
          className="absolute -top-2 -right-2 p-1 bg-background border rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
          onClick={e => {
            e.stopPropagation()
            onRemove(agent._id)
          }}
          aria-label="Remove agent"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage
          src={
            agent.userImage
              ? getCloudfrontOriginalUrl(agent.userImage)
              : undefined
          }
          alt={agent.name}
          className="object-cover"
        />
        <AvatarFallback className="bg-muted text-xs font-medium">
          {agent.name?.slice(0, 2).toUpperCase() || 'AG'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{agent.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          by{' '}
          <Link
            href={`/creators/${agent.owner?.username}`}
            onClick={e => e.stopPropagation()}
            className="hover:underline"
          >
            @{agent.owner?.username || 'anonymous'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export const ParticipantsTab = ({
  agents,
  onAgentsChange,
  permissions,
  onPermissionsChange,
  sessionId,
  isPermissionsLoading,
  isSavingPermissions,
}: ParticipantsTabProps) => {
  const { user } = useAuthState()
  const [agentToChange, setAgentToChange] = useState<Agent | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [permissionLevel, setPermissionLevel] =
    useState<PermissionLevelOption>('participant')

  const addAgentGate = useGatedResource(GatedResource.AddAgent)

  const grouped = useMemo(() => {
    const by = {
      owner: [] as SessionPermission[],
      editor: [] as SessionPermission[],
      participant: [] as SessionPermission[],
      viewer: [] as SessionPermission[],
    }
    permissions.forEach(p => {
      const level = p.level as PermissionLevelOption
      if (by[level]) by[level].push(p)
    })
    return by
  }, [permissions])

  const handleAgentSelect = (newAgent: Agent) => {
    if (agentToChange) {
      // Replace the specific agent
      onAgentsChange(
        agents.map(a => (a._id === agentToChange._id ? newAgent : a)),
      )
      setAgentToChange(null)
    }
  }

  const handleRemoveAgent = (agentId: string) => {
    if (agents.length > 1) {
      onAgentsChange(agents.filter(a => a._id !== agentId))
    }
  }

  const handleAddPermission = () => {
    const username = newUsername.trim()
    if (!username) return
    const exists = permissions.some(p => p.user?.username === username)
    if (exists) return
    onPermissionsChange([
      ...permissions,
      {
        _id: `temp-${Date.now()}`,
        session: sessionId || '',
        user: { _id: '', username },
        level: permissionLevel as SessionPermissionLevel,
        grantedAt: new Date(),
      } as SessionPermission,
    ])
    setNewUsername('')
  }

  const handleRemovePermission = (username: string) => {
    onPermissionsChange(permissions.filter(p => p.user?.username !== username))
  }

  return (
    <div className="space-y-8">
      {/* Edit Agents Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-lg">Edit Agents</h3>
          <p className="text-sm text-muted-foreground">
            Click on an agent to replace it, or add more agents to the session.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map(agent => (
            <AgentCard
              key={agent._id}
              agent={agent}
              canRemove={agents.length > 1}
              onRemove={handleRemoveAgent}
              onSelect={setAgentToChange}
            />
          ))}

          {/* Add Agent Button - only for preview users */}
          {user?.featureFlags?.includes(FeatureFlag.Preview) &&
            addAgentGate.shouldRender &&
            agents.length < MAX_AGENTS && (
              <AgentSelectorModal
                trigger={
                  <button
                    className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    onClick={event => {
                      if (!addAgentGate.isAllowed) {
                        event.preventDefault()
                        event.stopPropagation()
                        addAgentGate.openGate()
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add agents</span>
                  </button>
                }
                selectedAgents={agents}
                onChange={onAgentsChange}
              />
            )}
        </div>

        {agents.length >= MAX_AGENTS && (
          <p className="text-sm text-muted-foreground">
            Maximum of {MAX_AGENTS} agents reached.
          </p>
        )}
      </div>

      {/* Invite Users Section */}
      {sessionId && (
        <div className="space-y-4 border-t pt-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-medium text-lg">Invite Users</h3>
              <p className="text-sm text-muted-foreground">
                Invite Eden users as owners, editors, participants, or viewers.
                Participants can interact; viewers are read-only but can open
                private sessions.
              </p>
            </div>
            {(isPermissionsLoading || isSavingPermissions) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="Enter Eden username..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddPermission()
                }
              }}
              disabled={isSavingPermissions}
              className="flex-1"
            />
            <Select
              value={permissionLevel}
              onValueChange={value =>
                setPermissionLevel(value as PermissionLevelOption)
              }
              disabled={isSavingPermissions}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="participant">Participant</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddPermission}
              type="button"
              disabled={!newUsername.trim() || isSavingPermissions}
            >
              Add
            </Button>
          </div>

          {['owner', 'editor', 'participant', 'viewer'].map(level => {
            const list = grouped[level as PermissionLevelOption]
            if (!list?.length) return null
            const label =
              level === 'owner'
                ? 'Owners'
                : level === 'editor'
                ? 'Editors'
                : level === 'participant'
                ? 'Participants'
                : 'Viewers'
            const Icon =
              level === 'owner'
                ? ShieldIcon
                : level === 'editor'
                ? UserIcon
                : level === 'participant'
                ? MessageSquareIcon
                : EyeIcon
            const badge =
              level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
            return (
              <div key={level} className="space-y-2">
                <Label className="text-sm font-medium">{label}</Label>
                <div className="space-y-2">
                  {list.map(permission => (
                    <div
                      key={permission.user?.username || permission._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {permission.user?.username || 'Unknown user'}
                        </span>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                          {badge}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemovePermission(
                            permission.user?.username || '',
                          )
                        }
                        type="button"
                        className="hover:bg-destructive hover:text-destructive-foreground"
                        disabled={isSavingPermissions}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Single Agent Selector Modal - for changing individual agent */}
      {agentToChange && (
        <SingleAgentSelectorModal
          open={!!agentToChange}
          onOpenChange={open => !open && setAgentToChange(null)}
          onSelect={handleAgentSelect}
        />
      )}
    </div>
  )
}
