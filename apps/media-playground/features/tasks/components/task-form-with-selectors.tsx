'use client'

import { SessionSelector } from './session-selector'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskForm } from '@/features/sessions/components/session-settings-tabs/task-form'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentSessionListQuery } from '@/hooks/query/use-agent-session-list-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent, SessionV2, Trigger } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type TaskFormWithSelectorsProps = {
  mode: 'agent' | 'global'
  agentId?: string // Required for agent mode
  editingTask?: Trigger | null
  onCancel: () => void
  onSave: () => void
}

const taskSchema = z.object({
  sessionId: z.string().min(1, 'Please select a session'),
})

type TaskFormData = z.infer<typeof taskSchema>

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

  // Agent mode flow: Session selector → Task form (separate screens)
  if (mode === 'agent') {
    if (!selectedSession) {
      return (
        <SessionSelector
          agentId={agentId!}
          onSelect={setSelectedSession}
          onCancel={onCancel}
        />
      )
    }

    return (
      <TaskForm
        sessionId={selectedSession._id}
        editingTask={editingTask}
        onCancel={() => setSelectedSession(null)}
        onSave={onSave}
      />
    )
  }

  // Global mode flow: Combined single screen
  if (mode === 'global') {
    const currentAgentUsername = selectedAgent?.username

    return (
      <div className="space-y-4">
        {/* Agent Selector */}
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

        {/* Session Selector - Inline */}
        {currentAgentUsername && (
          <SessionSelectorInline
            agentUsername={currentAgentUsername}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
          />
        )}

        {/* Task Form - Inline */}
        {selectedSession && (
          <TaskForm
            sessionId={selectedSession._id}
            editingTask={editingTask}
            onCancel={onCancel}
            onSave={onSave}
          />
        )}

        {/* Actions - Show when no session selected yet */}
        {!selectedSession && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
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

// Inline session selector component for the combined view
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

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      sessionId: selectedSession?._id || '',
    },
  })

  // Reset form when sessions change
  useEffect(() => {
    form.setValue('sessionId', '')
    onSessionChange(null)
  }, [agentUsername]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSessionChange = (sessionId: string) => {
    const session = sessions?.find(s => s?._id === sessionId)
    if (session) {
      onSessionChange(session)
      form.setValue('sessionId', sessionId)
    }
  }

  return (
    <FormField
      control={form.control}
      name="sessionId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm text-muted-foreground">
            Session *
          </FormLabel>
          <FormControl>
            {isLoading ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            ) : isError ? (
              <div className="p-2 text-sm text-destructive">
                Error loading sessions. Please try again.
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No sessions found with this agent. Start a chat to create a
                session.
              </div>
            ) : (
              <Select
                onValueChange={handleSessionChange}
                value={field.value}
                disabled={!sessions || sessions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {sessions.map(session => (
                    <SelectItem key={session?._id} value={session?._id ?? ''}>
                      {session?.title || 'Untitled Session'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
