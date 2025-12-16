'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    }
  }, [selectedAgent, mode])

  // Reset all selections when form opens/closes (when editingTask changes)
  useEffect(() => {
    if (!editingTask) {
      setSelectedAgent(null)
      setSelectedSession(null)
    }
  }, [editingTask])

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(false)
  }

  // Agent mode flow: Session selector + Task form (combined on one screen)
  if (mode === 'agent') {
    return (
      <div className="space-y-4">
        {/* Session Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Session *</label>
          <SessionSelectorInline
            agentUsername={agentId!}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
          />
        </div>

        {/* Task Form - Always visible */}
        <TaskForm
          sessionId={selectedSession?._id || ''}
          editingTask={editingTask}
          onCancel={onCancel}
          onSave={onSave}
          hideHeader={true}
          disabled={!selectedSession}
        />
      </div>
    )
  }

  // Global mode flow: Combined single screen - clean and minimal
  if (mode === 'global') {
    const currentAgentUsername = selectedAgent?.username

    return (
      <div className="space-y-4">
        {/* Agent Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Agent *</label>
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
            <label className="text-sm text-muted-foreground">Session *</label>
            <SessionSelectorInline
              agentUsername={currentAgentUsername}
              selectedSession={selectedSession}
              onSessionChange={setSelectedSession}
            />
          </div>
        )}

        {/* Task Form - Always visible when agent is selected */}
        {currentAgentUsername && (
          <TaskForm
            sessionId={selectedSession?._id || ''}
            editingTask={editingTask}
            onCancel={onCancel}
            onSave={onSave}
            hideHeader={true}
            disabled={!selectedSession}
          />
        )}

        {/* Agent Selector Modal */}
        <SingleAgentSelectorModal
          open={showAgentModal}
          onOpenChange={setShowAgentModal}
          onSelect={handleAgentSelect}
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
}

const SessionSelectorInline: FC<SessionSelectorInlineProps> = ({
  agentUsername,
  selectedSession,
  onSessionChange,
}) => {
  const { sessions, isLoading, isError } = useAgentSessionListQuery({
    agentId: agentUsername,
    enabled: !!agentUsername,
  })

  // Reset selection when agent changes
  useEffect(() => {
    onSessionChange(null)
  }, [agentUsername]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSessionChange = (sessionId: string) => {
    const session = sessions?.find(s => s?._id === sessionId)
    if (session) {
      onSessionChange(session)
    }
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

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-2 text-sm text-muted-foreground">
        No sessions found with this agent. Start a chat to create a session.
      </div>
    )
  }

  return (
    <Select
      onValueChange={handleSessionChange}
      value={selectedSession?._id || ''}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a session" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {sessions.map(session => {
          const sessionAgents = (
            typeof session?.agents !== 'undefined' ? session.agents : []
          ) as TriggerSessionAgent[]

          return (
            <SelectItem key={session?._id} value={session?._id ?? ''}>
              <div className="flex items-center gap-2 w-full">
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
                <span className="flex-1">
                  {session?.title || 'Untitled Session'}
                </span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
