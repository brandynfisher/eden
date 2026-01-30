'use client'

import DiscordIcon from '@/components/icons/discord'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { TaskForm } from '@/features/sessions/components/session-settings-tabs/task-form'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentSessionListQuery } from '@/hooks/query/use-agent-session-list-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  Agent,
  SessionTarget,
  SessionV2,
  Trigger,
  TriggerSessionAgent,
} from '@edenlabs/eden-sdk'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'

type TaskFormWithSelectorsProps = {
  mode: 'agent' | 'global'
  agentId?: string // Required for agent mode
  editingTask?: Trigger | null
  onCancel: () => void
  onSave: () => void
}

export const TaskFormWithSelectors: FC<TaskFormWithSelectorsProps> = ({
  mode,
  agentId,
  editingTask,
  onCancel,
  onSave,
}) => {
  const { user } = useAuthState()
  const { lastAgents } = useUserPreferencesQuery({
    enabled: !!user && mode === 'global',
  })

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionV2 | null>(null)
  const [sessionTarget, setSessionTarget] = useState<SessionTarget>('new')
  const [showAgentModal, setShowAgentModal] = useState(false)

  // Get the default agent (first from lastAgents) for global mode
  const defaultAgentId = mode === 'global' ? lastAgents?.[0]?._id : undefined
  const { agent: defaultAgent, isLoading: isLoadingDefaultAgent } =
    useAgentQuery({
      key: defaultAgentId || '',
      enabled: !!defaultAgentId && !selectedAgent && mode === 'global',
    })

  // Set default agent when loaded (global mode only)
  useEffect(() => {
    if (defaultAgent && !selectedAgent && mode === 'global') {
      setSelectedAgent(defaultAgent)
    }
  }, [defaultAgent, selectedAgent, mode])

  // Reset session when agent changes (global mode)
  useEffect(() => {
    if (mode === 'global') {
      setSelectedSession(null)
      setSessionTarget('new')
    }
  }, [selectedAgent, mode])

  // Reset all selections when form opens/closes (when editingTask changes)
  useEffect(() => {
    if (!editingTask) {
      setSelectedAgent(null)
      setSelectedSession(null)
      setSessionTarget('new')
    }
  }, [editingTask])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(false)
  }

  // Agent mode flow: Session selector + Task form (combined on one screen)
  if (mode === 'agent') {
    // When editing, use the task's existing session and don't show selector
    if (editingTask) {
      const taskSessionId =
        typeof editingTask.session === 'string'
          ? editingTask.session
          : editingTask.session?._id

      return (
        <TaskForm
          sessionId={taskSessionId}
          agentId={agentId}
          editingTask={editingTask}
          onCancel={onCancel}
          onSave={onSave}
          hideHeader={true}
        />
      )
    }

    // When creating, show session selector
    return (
      <div className="space-y-4">
        {/* Session Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Session</label>
          <SessionSelectorInline
            agentUsername={agentId!}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
            sessionTarget={sessionTarget}
            onSessionTargetChange={setSessionTarget}
          />
        </div>

        {/* Task Form - Always visible */}
        <TaskForm
          sessionId={selectedSession?._id}
          agentId={agentId}
          editingTask={editingTask}
          onCancel={onCancel}
          onSave={onSave}
          hideHeader={true}
          disabled={false}
          sessionTarget={sessionTarget}
        />
      </div>
    )
  }

  // Global mode flow: Combined single screen - clean and minimal
  if (mode === 'global') {
    // When editing, use the task's existing session and don't show selectors
    if (editingTask) {
      const taskSessionId =
        typeof editingTask.session === 'string'
          ? editingTask.session
          : editingTask.session?._id

      // Get agent ID from the editingTask
      const taskAgentId = editingTask.agent
        ? typeof editingTask.agent === 'string'
          ? editingTask.agent
          : editingTask.agent.username
        : undefined

      return (
        <TaskForm
          sessionId={taskSessionId}
          agentId={taskAgentId}
          editingTask={editingTask}
          onCancel={onCancel}
          onSave={onSave}
          hideHeader={true}
        />
      )
    }

    // When creating, show agent and session selectors
    const currentAgentUsername = selectedAgent?.username

    return (
      <div className="space-y-4">
        {/* Agent Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Agent</label>
          {isLoadingDefaultAgent && !selectedAgent ? (
            <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading agent...</span>
            </div>
          ) : selectedAgent ? (
            <button
              type="button"
              onClick={() => setShowAgentModal(true)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    selectedAgent.userImage
                      ? getCloudfrontOriginalUrl(selectedAgent.userImage)
                      : undefined
                  }
                  alt={selectedAgent.name}
                />
                <AvatarFallback>
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{selectedAgent.name}</div>
                <div className="text-sm text-muted-foreground">
                  @{selectedAgent.username}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Change</div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAgentModal(true)}
              className="w-full p-4 rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
            >
              Click to select an agent
            </button>
          )}
        </div>

        {/* Session Selection */}
        {currentAgentUsername && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Session</label>
            <SessionSelectorInline
              agentUsername={currentAgentUsername}
              selectedSession={selectedSession}
              onSessionChange={setSelectedSession}
              sessionTarget={sessionTarget}
              onSessionTargetChange={setSessionTarget}
            />
          </div>
        )}

        {/* Task Form - Always visible when agent is selected */}
        {currentAgentUsername && (
          <TaskForm
            sessionId={selectedSession?._id}
            agentId={currentAgentUsername}
            editingTask={editingTask}
            onCancel={onCancel}
            onSave={onSave}
            hideHeader={true}
            disabled={false}
            sessionTarget={sessionTarget}
          />
        )}

        {/* Agent Selector Modal */}
        <SingleAgentSelectorModal
          open={showAgentModal}
          onOpenChange={setShowAgentModal}
          onSelect={handleAgentSelect}
          allowedTabs={['user', 'shared']}
          description="Choose an agent to create a task for"
        />
      </div>
    )
  }

  return null
}

// Inline session selector component with agent avatars
type SessionSelectorInlineProps = {
  agentUsername: string
  selectedSession: SessionV2 | null
  onSessionChange: (session: SessionV2 | null) => void
  sessionTarget: SessionTarget
  onSessionTargetChange: (target: SessionTarget) => void
}

const SessionSelectorInline: FC<SessionSelectorInlineProps> = ({
  agentUsername,
  selectedSession,
  onSessionChange,
  sessionTarget,
  onSessionTargetChange,
}) => {
  const { user } = useAuthState()
  const { sessions, isLoading, isError } = useAgentSessionListQuery({
    agentId: agentUsername,
    enabled: !!agentUsername,
  })

  const hasDiscord = !!user?.discordId

  // Filter sessions to only show those where user has owner/editor permissions
  const editableSessions = sessions?.filter(session => {
    if (!session || !user) return false

    // Check if user is the owner
    const ownerId =
      typeof session.owner === 'string' ? session.owner : session.owner?._id
    if (ownerId === user._id) {
      return true
    }

    // Check if user has owner/editor permission
    const permissionLevel = (
      session as SessionV2 & { permission_level_for_user?: string }
    ).permission_level_for_user
    return permissionLevel === 'owner' || permissionLevel === 'editor'
  })

  // Reset selection when agent changes
  useEffect(() => {
    onSessionChange(null)
    onSessionTargetChange('new')
  }, [agentUsername]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSessionChange = (value: string) => {
    if (value === '__create_new__') {
      onSessionChange(null)
      onSessionTargetChange('new')
    } else if (value === '__discord_dm__') {
      onSessionChange(null)
      onSessionTargetChange('discord_dm')
    } else {
      const session = editableSessions?.find(s => s?._id === value)
      if (session) {
        onSessionChange(session)
        onSessionTargetChange('existing')
      }
    }
  }

  // Determine current value for the Select
  const getCurrentValue = () => {
    if (sessionTarget === 'discord_dm') {
      return '__discord_dm__'
    }
    if (selectedSession?._id) {
      return selectedSession._id
    }
    return '__create_new__'
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading sessions...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-2 text-sm text-destructive">
        Error loading sessions. Please try again.
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Select onValueChange={handleSessionChange} value={getCurrentValue()}>
        <SelectTrigger>
          <SelectValue placeholder="Select a session" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {/* Create new session option */}
          <SelectItem value="__create_new__">Create new session</SelectItem>

          {/* Discord DM option */}
          {hasDiscord ? (
            <SelectItem value="__discord_dm__">
              <div className="flex items-center gap-2">
                <DiscordIcon size={16} />
                <span>DM me on Discord</span>
              </div>
            </SelectItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex w-full cursor-not-allowed select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none opacity-50">
                  <div className="flex items-center gap-2">
                    <DiscordIcon size={16} />
                    <span>DM me on Discord</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Link your Discord account in settings</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Existing sessions */}
          {editableSessions?.map(session => {
            const sessionAgents = (
              typeof session?.agents !== 'undefined' ? session.agents : []
            ) as TriggerSessionAgent[]

            return (
              <SelectItem key={session?._id} value={session?._id ?? ''}>
                <div className="flex items-center gap-2">
                  {sessionAgents.length > 0 && (
                    <AgentAvatars
                      agents={sessionAgents.map(a => ({
                        _id: a._id,
                        username: a.username,
                        name: a.name || a.username,
                        userImage: a.userImage,
                      }))}
                    />
                  )}
                  <span>{session?.title || 'Untitled Session'}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </TooltipProvider>
  )
}
