'use client'

import { SessionSelector } from './session-selector'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { Loader2, Sparkles } from 'lucide-react'
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

  // Global mode flow: Combined single screen with refined editorial design
  if (mode === 'global') {
    const currentAgentUsername = selectedAgent?.username

    return (
      <div className="task-creation-form">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

          .task-creation-form {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont,
              sans-serif;
            animation: fadeIn 0.4s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .section-card {
            position: relative;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.02) 0%,
              rgba(255, 255, 255, 0.01) 100%
            );
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }

          .section-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.1),
              transparent
            );
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .section-card:hover::before {
            opacity: 1;
          }

          .section-card:hover {
            border-color: rgba(255, 255, 255, 0.12);
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.03) 0%,
              rgba(255, 255, 255, 0.02) 100%
            );
          }

          .section-label {
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1),
              transparent
            );
          }

          .agent-display {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .agent-display::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.05),
              transparent
            );
            transition: left 0.5s ease;
          }

          .agent-display:hover::before {
            left: 100%;
          }

          .agent-display:hover {
            background: rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
          }

          .agent-name {
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 17px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            letter-spacing: -0.01em;
          }

          .agent-username {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 500;
          }

          .change-button {
            font-size: 12px;
            color: rgba(147, 51, 234, 0.9);
            font-weight: 600;
            letter-spacing: 0.5px;
            transition: all 0.2s ease;
          }

          .agent-display:hover .change-button {
            color: rgba(147, 51, 234, 1);
            letter-spacing: 0.8px;
          }

          .session-dropdown {
            animation: slideDown 0.3s ease-out;
            animation-delay: 0.1s;
            animation-fill-mode: both;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .task-form-wrapper {
            animation: slideDown 0.3s ease-out;
            animation-delay: 0.2s;
            animation-fill-mode: both;
          }

          .sparkle-icon {
            color: rgba(147, 51, 234, 0.6);
            width: 14px;
            height: 14px;
          }
        `}</style>

        {/* Main Form Container */}
        <div className="space-y-5">
          {/* Agent Selection Section */}
          <div className="section-card">
            <div className="section-label">
              <Sparkles className="sparkle-icon" />
              Choose Agent
            </div>
            {isLoadingDefaultAgent && !selectedAgent ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-black/20 border border-white/5">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-white/60">Loading agent...</span>
              </div>
            ) : selectedAgent ? (
              <div
                className="agent-display"
                onClick={() => setShowAgentModal(true)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-500/20">
                    <AvatarImage
                      src={
                        selectedAgent.userImage
                          ? getCloudfrontOriginalUrl(selectedAgent.userImage)
                          : undefined
                      }
                      alt={selectedAgent.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-200">
                      {selectedAgent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="agent-name">{selectedAgent.name}</div>
                    <div className="agent-username">
                      @{selectedAgent.username}
                    </div>
                  </div>
                  <div className="change-button">CHANGE</div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAgentModal(true)}
                className="w-full p-5 rounded-lg border-2 border-dashed border-white/10 bg-black/10 hover:bg-black/20 hover:border-white/15 transition-all text-sm text-white/50 hover:text-white/70"
              >
                Click to select an agent
              </button>
            )}
          </div>

          {/* Session Selection Section */}
          {currentAgentUsername && (
            <div className="section-card session-dropdown">
              <div className="section-label">
                <Sparkles className="sparkle-icon" />
                Select Session
              </div>
              <SessionSelectorInline
                agentUsername={currentAgentUsername}
                selectedSession={selectedSession}
                onSessionChange={setSelectedSession}
              />
            </div>
          )}

          {/* Task Form Section */}
          {selectedSession && (
            <div className="task-form-wrapper">
              <TaskForm
                sessionId={selectedSession._id}
                editingTask={editingTask}
                onCancel={onCancel}
                onSave={onSave}
                hideHeader={true}
              />
            </div>
          )}

          {/* Cancel Button - Show when no session selected yet */}
          {!selectedSession && (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="text-white/60 hover:text-white/80"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        <span className="text-sm text-white/60">Loading sessions...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400">
          Error loading sessions. Please try again.
        </p>
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-sm text-amber-400/80">
          No sessions found with this agent. Start a chat to create a session.
        </p>
      </div>
    )
  }

  return (
    <Select
      onValueChange={handleSessionChange}
      value={selectedSession?._id || ''}
    >
      <SelectTrigger className="h-auto py-3 bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/15 transition-all">
        <SelectValue placeholder="Select a session" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-white/10">
        {sessions.map(session => {
          const sessionAgents = (
            typeof session?.agents !== 'undefined' ? session.agents : []
          ) as TriggerSessionAgent[]

          return (
            <SelectItem
              key={session?._id}
              value={session?._id ?? ''}
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5 py-3"
            >
              <div className="flex items-center gap-3 w-full">
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
                <span className="flex-1 text-sm font-medium">
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
