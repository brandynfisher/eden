'use client'

import { MessageInput } from './message-input'
import { useAppShell } from '@/components/layout/app-shell'
import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import {
  SessionSettings,
  SessionSettingsModal,
} from '@/features/sessions/components/session-settings-modal'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useUpdateUserPreferences } from '@/hooks/mutation/use-update-user-preferences'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  EditIcon,
  ExternalLink,
  HelpCircle,
  MenuIcon,
  PenLine,
  Plus,
  Settings,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type AgentCardProps = {
  agent: Agent
  index: number
  canRemove: boolean
  currentUserId?: string
  onRemove: (agentId: string) => void
  onOpenSettings: (agentKey: string) => void
  onSelect: (agent: Agent) => void
}

const SelectedAgentCard = ({
  agent,
  index: _index, // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
  canRemove,
  currentUserId,
  onRemove,
  onOpenSettings,
  onSelect,
}: AgentCardProps) => {
  const { hasEditAccess, isLoading: isPermissionsLoading } =
    useAgentPermissions(agent, currentUserId)
  const showSettings = hasEditAccess && !isPermissionsLoading

  return (
    <div className="agent-card">
      <div
        className="agent-card-inner group"
        onClick={() => onSelect(agent)}
        style={{ cursor: 'pointer' }}
      >
        {/* Remove button - only show if more than one agent */}
        {canRemove && (
          <button
            className="agent-remove-btn"
            onClick={e => {
              e.stopPropagation()
              onRemove(agent._id)
            }}
            aria-label="Remove agent"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top left action buttons */}
        <div className="agent-action-buttons">
          {/* View agent profile button */}
          <Link
            href={`/agents/${agent.username}`}
            onClick={e => e.stopPropagation()}
            className="agent-action-btn"
            title="View Agent Profile"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Settings button - only show for agents user can edit */}
          {showSettings && (
            <button
              onClick={e => {
                e.stopPropagation()
                onOpenSettings(agent.username || agent._id)
              }}
              className="agent-action-btn"
              title="Agent Settings"
            >
              <Settings className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="agent-avatar-wrapper">
          <div className="agent-avatar-glow" />
          <Avatar className="agent-avatar">
            <AvatarImage
              className="object-cover"
              src={getCloudfrontOriginalUrl(agent.userImage)}
              alt={agent.name}
            />
            <AvatarFallback className="agent-avatar-fallback">
              {agent.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Agent Info */}
        <div className="agent-info">
          <Link
            href={`/agents/${agent.username}`}
            onClick={e => e.stopPropagation()}
            className="agent-name"
          >
            {agent.name}
          </Link>
          <p className="agent-creator">
            by{' '}
            {agent.owner?.username ? (
              <Link
                href={`/creators/${agent.owner.username}`}
                onClick={e => e.stopPropagation()}
                className="hover:text-foreground hover:underline transition-colors"
              >
                @{agent.owner.username}
              </Link>
            ) : (
              '@anonymous'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

const ChatLaunchpad = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isSignedIn } = useAuthState()
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [agentToChange, setAgentToChange] = useState<Agent | null>(null)
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false)
  const [isSessionModeHelpOpen, setIsSessionModeHelpOpen] = useState(false)
  const addAgentGate = useGatedResource(GatedResource.AddAgent)
  const sessionSettingsGate = useGatedResource(GatedResource.SessionSettings)
  const queryClient = useQueryClient()

  // Session settings state
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    type: 'passive',
    context: '',
    conductor_prompt: '',
    delay_interval: 0,
    mention_force_reply: false,
    manna_budget_unlimited: true,
    token_budget_unlimited: true,
    turn_budget_unlimited: true,
    incognito: false,
  })

  // Get user preferences for last agent
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!isSignedIn })
  const lastAgentId = lastAgents.length > 0 ? lastAgents[0]._id : undefined

  // Parse agent parameter from URL
  const agentParam = searchParams?.get('agent')
  const agentKeys = agentParam ? agentParam.split(',') : []

  // Fetch agents from URL parameter
  const { agent: urlAgent1, isLoading: loading1 } = useAgentQuery({
    key: agentKeys[0] || '',
    enabled: agentKeys.length > 0 && !!agentKeys[0],
  })
  const { agent: urlAgent2, isLoading: loading2 } = useAgentQuery({
    key: agentKeys[1] || '',
    enabled: agentKeys.length > 1 && !!agentKeys[1],
  })
  const { agent: urlAgent3, isLoading: loading3 } = useAgentQuery({
    key: agentKeys[2] || '',
    enabled: agentKeys.length > 2 && !!agentKeys[2],
  })
  const { agent: urlAgent4, isLoading: loading4 } = useAgentQuery({
    key: agentKeys[3] || '',
    enabled: agentKeys.length > 3 && !!agentKeys[3],
  })
  const { agent: urlAgent5, isLoading: loading5 } = useAgentQuery({
    key: agentKeys[4] || '',
    enabled: agentKeys.length > 4 && !!agentKeys[4],
  })
  const { agent: urlAgent6, isLoading: loading6 } = useAgentQuery({
    key: agentKeys[5] || '',
    enabled: agentKeys.length > 5 && !!agentKeys[5],
  })
  const { agent: urlAgent7, isLoading: loading7 } = useAgentQuery({
    key: agentKeys[6] || '',
    enabled: agentKeys.length > 6 && !!agentKeys[6],
  })
  const { agent: urlAgent8, isLoading: loading8 } = useAgentQuery({
    key: agentKeys[7] || '',
    enabled: agentKeys.length > 7 && !!agentKeys[7],
  })

  // Start with one agent (either last agent or default to eve) if no URL params
  const { agent: defaultAgent, isLoading: loadingDefault } = useAgentQuery({
    key: lastAgentId || 'eve',
    enabled: agentKeys.length === 0,
  })

  // Check if we're still loading agents
  const isLoadingAgents =
    agentKeys.length > 0
      ? (agentKeys[0] && loading1) ||
        (agentKeys[1] && loading2) ||
        (agentKeys[2] && loading3) ||
        (agentKeys[3] && loading4) ||
        (agentKeys[4] && loading5) ||
        (agentKeys[5] && loading6) ||
        (agentKeys[6] && loading7) ||
        (agentKeys[7] && loading8)
      : loadingDefault

  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const { mutateAsync: updateUserPreferences } = useUpdateUserPreferences()
  const lastSyncedAgentsSignature = useRef<string | null>(null)

  // Initialize selected agents from URL or default agent without overwriting user changes
  const initializedAgentsRef = useRef<string | null>(null)
  const userManuallyChangedAgents = useRef<boolean>(false)

  // Initialize with agents from URL or default agent
  useEffect(() => {
    // Don't overwrite user's manual selection
    if (userManuallyChangedAgents.current) {
      return
    }

    if (agentKeys.length > 0) {
      // Use agents from URL parameter
      const urlAgents = [
        urlAgent1,
        urlAgent2,
        urlAgent3,
        urlAgent4,
        urlAgent5,
        urlAgent6,
        urlAgent7,
        urlAgent8,
      ].filter((agent): agent is Agent => !!agent)

      if (urlAgents.length === 0) {
        return
      }

      const signature = `params:${agentParam}|${urlAgents
        .map(agent => agent._id)
        .join(',')}`
      if (initializedAgentsRef.current === signature) {
        return
      }

      if (urlAgents.length > 0) {
        setSelectedAgents(urlAgents)
        initializedAgentsRef.current = signature
      }
    } else if (defaultAgent) {
      const signature = `default:${defaultAgent._id}`
      if (initializedAgentsRef.current !== signature) {
        // Use default agent if no URL parameter
        setSelectedAgents([defaultAgent])
        initializedAgentsRef.current = signature
      }
    }
  }, [
    defaultAgent,
    urlAgent1,
    urlAgent2,
    urlAgent3,
    urlAgent4,
    urlAgent5,
    urlAgent6,
    urlAgent7,
    urlAgent8,
    agentParam, // Watch for changes in the agent parameter itself
  ])

  useEffect(() => {
    if (!isSignedIn) return
    if (selectedAgents.length === 0) return

    const agentIds = Array.from(
      new Set(selectedAgents.map(agent => agent._id).filter(Boolean)),
    ).sort()

    if (agentIds.length === 0) return

    const syncPreferences = async () => {
      const signature = `${agentParam || 'manual'}|${agentIds.join(',')}`
      if (lastSyncedAgentsSignature.current === signature) {
        return
      }

      try {
        await Promise.all(agentIds.map(id => updateUserPreferences(id)))
        lastSyncedAgentsSignature.current = signature
      } catch (error) {
        console.error('Failed to update recent agents from chat params', error)
      } finally {
        void queryClient.refetchQueries({ queryKey: ['user-preferences'] })
      }
    }

    syncPreferences()
  }, [
    agentParam,
    isSignedIn,
    queryClient,
    selectedAgents,
    updateUserPreferences,
  ])

  // Configure app shell with sidebar
  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
            }}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-semibold">New Chat</span>
          </button>
          <button
            onClick={() => {
              close()
              setIsAgentSelectorOpen(true)
            }}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="New Chat"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[], thinking?: boolean) => {
      if (!user || selectedAgents.length === 0) return

      setIsCreatingSession(true)

      try {
        const payload: {
          content: string
          attachments?: string[]
          agent_ids: string[]
          thinking?: boolean
          session_type: string
          status?: string
          context?: string
          tools?: string[]
          settings?: {
            conductor_prompt?: string
            delay_interval?: number
            mention_force_reply?: boolean
          }
          budget?: {
            manna_budget?: number
            token_budget?: number
            turn_budget?: number
          }
          extras?: {
            incognito?: boolean
          }
        } = {
          content,
          attachments,
          agent_ids: selectedAgents.map(a => a._id),
          thinking,
          session_type: sessionSettings.type,
          // Automatic sessions start paused
          ...(sessionSettings.type === 'automatic' && { status: 'paused' }),
        }

        // Add session settings if configured
        if (sessionSettings.context) {
          payload.context = sessionSettings.context
        }

        if (
          sessionSettings.conductor_prompt ||
          sessionSettings.delay_interval > 0 ||
          sessionSettings.mention_force_reply
        ) {
          payload.settings = {
            conductor_prompt: sessionSettings.conductor_prompt,
            delay_interval: sessionSettings.delay_interval,
            mention_force_reply: sessionSettings.mention_force_reply,
          }
        }

        // Add incognito to extras
        if (sessionSettings.incognito) {
          payload.extras = {
            ...payload.extras,
            incognito: true,
          }
        }

        // Add budget settings if configured
        const budget: {
          manna_budget?: number
          token_budget?: number
          turn_budget?: number
        } = {}
        if (
          !sessionSettings.manna_budget_unlimited &&
          sessionSettings.manna_budget
        ) {
          budget.manna_budget = sessionSettings.manna_budget
        }
        if (
          !sessionSettings.token_budget_unlimited &&
          sessionSettings.token_budget
        ) {
          budget.token_budget = sessionSettings.token_budget
        }
        if (
          !sessionSettings.turn_budget_unlimited &&
          sessionSettings.turn_budget
        ) {
          budget.turn_budget = sessionSettings.turn_budget
        }
        if (Object.keys(budget).length > 0) {
          payload.budget = budget
        }

        const response = await fetch('/api/sessions/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        // Parse SSE stream to extract session_id from session_created event
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let sessionId: string | null = null

        while (!sessionId) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = line.slice(6).trim()
                if (!payload || payload === '[DONE]') continue
                const data = JSON.parse(payload)
                if (data.event === 'session_created' && data.data?.session_id) {
                  sessionId = data.data.session_id
                  break
                }
              } catch {
                // Ignore parse errors for incomplete lines
              }
            }
          }
        }

        reader.releaseLock()

        if (sessionId) {
          router.push(`/sessions/${sessionId}`)
        } else {
          throw new Error('No session_id received from stream')
        }
      } catch (error) {
        console.error('Error creating session:', error)
        setIsCreatingSession(false)
      }
    },
    [user, selectedAgents, router, sessionSettings],
  )

  const handleAgentsChange = (agents: Agent[]) => {
    userManuallyChangedAgents.current = true
    setSelectedAgents(agents)
  }

  const removeAgent = (agentId: string) => {
    // Always keep at least one agent
    if (selectedAgents.length > 1) {
      userManuallyChangedAgents.current = true
      setSelectedAgents(prev => prev.filter(a => a._id !== agentId))
    }
  }

  if (isLoadingAgents || isCreatingSession || selectedAgents.length === 0) {
    return (
      <main className="chat-launchpad-container">
        <div className="chat-launchpad-loading">
          <div className="loading-spinner" />
        </div>
        <style jsx>{`
          .chat-launchpad-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: hsl(var(--background));
          }

          .chat-launchpad-loading {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid hsl(var(--primary) / 0.2);
            border-top-color: hsl(var(--primary));
            border-radius: 50%;
            animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    )
  }

  // Ensure selectedAgents is initialized with defaultAgent
  if (selectedAgents.length === 0 && defaultAgent) {
    setSelectedAgents([defaultAgent])
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">New Chat</h1>
        <div className="ml-auto">
          <button
            onClick={() => setIsAgentSelectorOpen(true)}
            className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
            aria-label="New chat"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <main className="chat-launchpad-container">
        <div className="chat-launchpad-content">
          {/* Agent Display Area */}
          <div className="agents-section">
            <div
              className="agents-collection"
              data-agent-count={selectedAgents.length}
            >
              {selectedAgents.map((agent, index) => (
                <SelectedAgentCard
                  key={agent._id}
                  agent={agent}
                  index={index}
                  canRemove={selectedAgents.length > 1}
                  currentUserId={user?._id}
                  onRemove={removeAgent}
                  onOpenSettings={agentKey => setSettingsAgentId(agentKey)}
                  onSelect={setAgentToChange}
                />
              ))}

              {/* Add Agent Button - opens modal (only for preview users with gate check) */}
              {user?.featureFlags?.includes(FeatureFlag.Preview) &&
                addAgentGate.shouldRender && (
                  <AgentSelectorModal
                    trigger={
                      <button
                        className="add-agent-card"
                        onClick={event => {
                          if (!addAgentGate.isAllowed) {
                            event.preventDefault()
                            event.stopPropagation()
                            addAgentGate.openGate()
                          }
                        }}
                      >
                        <div className="add-agent-icon">
                          <Plus className="w-4 h-4" />
                        </div>
                        <p className="add-agent-text">Add agents</p>
                      </button>
                    }
                    selectedAgents={selectedAgents}
                    onChange={handleAgentsChange}
                  />
                )}
            </div>

            {/* Session Settings / Mode Selector - different for single vs multi-agent */}
            {sessionSettingsGate.shouldRender && (
              <>
                {/* Single agent: Show "Add context" button */}
                <button
                  className="session-settings-btn"
                  style={{
                    display: selectedAgents.length === 1 ? 'flex' : 'none',
                  }}
                  onClick={() => {
                    if (!sessionSettingsGate.isAllowed) {
                      sessionSettingsGate.openGate()
                      return
                    }
                    setIsSessionSettingsOpen(true)
                  }}
                >
                  <PenLine className="w-4 h-4" />
                  <span>Add context</span>
                </button>

                {/* Multi-agent: Show response mode selector inline */}
                <div
                  className="session-mode-selector"
                  style={{
                    display: selectedAgents.length > 1 ? 'flex' : 'none',
                  }}
                >
                  {/* Compact header with inline help */}
                  <div className="session-mode-compact-header">
                    <span className="session-mode-label-compact">
                      Response Mode
                    </span>
                    <button
                      className="session-mode-help-btn-compact"
                      onClick={() => setIsSessionModeHelpOpen(true)}
                      aria-label="Help"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Segmented control for mode selection */}
                  <div className="session-mode-segmented">
                    <button
                      type="button"
                      className={`session-mode-segment ${
                        sessionSettings.type === 'passive' ? 'active' : ''
                      }`}
                      onClick={() =>
                        setSessionSettings({
                          ...sessionSettings,
                          type: 'passive',
                        })
                      }
                    >
                      Passive
                    </button>
                    <button
                      type="button"
                      className={`session-mode-segment ${
                        sessionSettings.type === 'natural' ? 'active' : ''
                      }`}
                      onClick={() =>
                        setSessionSettings({
                          ...sessionSettings,
                          type: 'natural',
                        })
                      }
                    >
                      Natural
                    </button>
                    <button
                      type="button"
                      className={`session-mode-segment session-mode-segment-automatic ${
                        sessionSettings.type === 'automatic' ? 'active' : ''
                      }`}
                      onClick={() =>
                        setSessionSettings({
                          ...sessionSettings,
                          type: 'automatic',
                        })
                      }
                    >
                      Automatic
                      <span className="beta-tag">BETA</span>
                    </button>
                  </div>

                  {/* Description and warning inline */}
                  <div className="session-mode-meta">
                    <span className="session-mode-description-compact">
                      {sessionSettings.type === 'passive' &&
                        'Agents respond only when mentioned'}
                      {sessionSettings.type === 'natural' &&
                        'Agents listen and decide when to speak'}
                      {sessionSettings.type === 'automatic' &&
                        'Agents play out entire scenario'}
                    </span>
                    {sessionSettings.type === 'automatic' && (
                      <>
                        <span className="session-mode-divider">•</span>
                        <span className="session-mode-warning-compact">
                          <AlertTriangle className="w-3 h-3" />
                          High Manna cost
                        </span>
                      </>
                    )}
                  </div>

                  {/* Response time - only for automatic mode */}
                  {sessionSettings.type === 'automatic' && (
                    <div className="session-mode-delay-row">
                      <span className="delay-label">Response time:</span>
                      <Select
                        value={sessionSettings.delay_interval.toString()}
                        onValueChange={value =>
                          setSessionSettings({
                            ...sessionSettings,
                            delay_interval: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="session-mode-delay-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Instant</SelectItem>
                          <SelectItem value="60">1 min</SelectItem>
                          <SelectItem value="300">5 min</SelectItem>
                          <SelectItem value="1800">30 min</SelectItem>
                          <SelectItem value="10800">3 hrs</SelectItem>
                          <SelectItem value="86400">1 day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Message Input below agents */}
          <div className="message-input-section">
            <div className="message-input-container">
              <MessageInput
                sessionId="new"
                onStreamingMessage={handleSendMessage}
                enableVoiceInput={true}
                agent={selectedAgents[0]}
                placeholder={
                  selectedAgents.length > 1
                    ? 'Describe a scenario, game, or collaborative mission involving your agents'
                    : 'Write a message...'
                }
                expanded={selectedAgents.length > 1}
              />
            </div>
          </div>
        </div>

        {/* Single Agent Selector Modal - for changing individual agent */}
        {agentToChange && (
          <SingleAgentSelectorModal
            open={!!agentToChange}
            onOpenChange={open => !open && setAgentToChange(null)}
            onSelect={newAgent => {
              userManuallyChangedAgents.current = true
              setSelectedAgents(prev =>
                prev.map(a => (a._id === agentToChange._id ? newAgent : a)),
              )
              setAgentToChange(null)
            }}
          />
        )}

        {/* Agent Selector Modal - from mobile navbar */}
        <SingleAgentSelectorModal
          open={isAgentSelectorOpen}
          onOpenChange={setIsAgentSelectorOpen}
          onSelect={agent => {
            setIsAgentSelectorOpen(false)
            router.push(`/chat/${agent.username}`)
          }}
        />

        {/* Agent Settings Modal */}
        {settingsAgentId && (
          <AgentSettingsModal
            agentId={settingsAgentId}
            open={!!settingsAgentId}
            onOpenChange={open => !open && setSettingsAgentId(null)}
          />
        )}

        {/* Session Settings Modal */}
        <SessionSettingsModal
          open={isSessionSettingsOpen}
          onOpenChange={setIsSessionSettingsOpen}
          settings={sessionSettings}
          onSettingsChange={setSessionSettings}
          agents={selectedAgents}
          minimal={true}
        />

        {/* Response Mode Help Modal */}
        <Dialog
          open={isSessionModeHelpOpen}
          onOpenChange={setIsSessionModeHelpOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Response Modes</DialogTitle>
              <DialogDescription>
                Choose how your agents respond in multi-agent sessions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Passive Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Agents only respond when explicitly mentioned using @
                  mentions. Best for controlled conversations where you want to
                  direct specific agents.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Natural Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Agents actively listen to the conversation and autonomously
                  decide when they have something relevant to contribute. They
                  can jump in naturally without being mentioned.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Automatic Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Agents automatically play out the entire scenario you
                  describe. They will continue conversing with each other based
                  on their roles and context.
                  <strong className="block mt-2 text-yellow-600">
                    Warning: This mode can consume significant Manna as agents
                    continue their conversation autonomously.
                  </strong>
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsSessionModeHelpOpen(false)}>
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Styles - Using Eden's purple/blue color scheme */}
        <style jsx global>{`
          .chat-launchpad-container {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: hsl(var(--background));
            position: relative;
          }

          .chat-launchpad-container::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(
              ellipse at top,
              hsl(var(--primary) / 0.03) 0%,
              transparent 60%
            );
            pointer-events: none;
          }

          .chat-launchpad-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
            overflow-y: auto;
            padding: 1.5rem 1rem;
            gap: 1.5rem;
          }

          .agents-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            width: 100%;
            padding: 0 0.5rem;
          }

          .agents-collection {
            display: grid;
            gap: 0.625rem;
            justify-content: center;
            align-items: start;
            width: 100%;
            max-width: 100%;
            /* Mobile default - use fr units to fill available space */
            grid-template-columns: repeat(3, 1fr);
          }

          /* ===== MOBILE GRID LAYOUTS ===== */
          /* 1-3 agents: single row, big cards - use fr to fill width */
          .agents-collection[data-agent-count='1'] {
            grid-template-columns: minmax(160px, 220px);
          }
          .agents-collection[data-agent-count='2'] {
            grid-template-columns: repeat(2, 1fr);
            max-width: 360px;
          }
          .agents-collection[data-agent-count='3'] {
            grid-template-columns: repeat(3, 1fr);
          }

          /* 4 agents: 2x2 grid */
          .agents-collection[data-agent-count='4'] {
            grid-template-columns: repeat(2, 1fr);
            max-width: 320px;
          }

          /* 5-6 agents: 3 cols */
          .agents-collection[data-agent-count='5'],
          .agents-collection[data-agent-count='6'] {
            grid-template-columns: repeat(3, 1fr);
          }

          /* 7-9 agents: 3 cols */
          .agents-collection[data-agent-count='7'],
          .agents-collection[data-agent-count='8'],
          .agents-collection[data-agent-count='9'] {
            grid-template-columns: repeat(3, 1fr);
          }

          /* 10-12 agents: 4 cols */
          .agents-collection[data-agent-count='10'],
          .agents-collection[data-agent-count='11'],
          .agents-collection[data-agent-count='12'],
          .agents-collection[data-agent-count='13'] {
            grid-template-columns: repeat(4, 1fr);
          }

          /* ===== DESKTOP GRID LAYOUTS ===== */
          @media (min-width: 768px) {
            .chat-launchpad-content {
              padding: 2.5rem 2rem;
              gap: 2rem;
            }

            .agents-section {
              gap: 1.25rem;
              max-width: 70%;
              padding: 0;
            }

            .agents-collection {
              gap: 1.5rem;
              max-width: none;
            }

            /* 1-4 agents: single row, generous cards */
            .agents-collection[data-agent-count='1'] {
              grid-template-columns: minmax(0, 280px);
            }
            .agents-collection[data-agent-count='2'] {
              grid-template-columns: repeat(2, minmax(0, 220px));
              max-width: none;
            }
            .agents-collection[data-agent-count='3'] {
              grid-template-columns: repeat(3, minmax(0, 200px));
            }
            .agents-collection[data-agent-count='4'] {
              grid-template-columns: repeat(4, minmax(0, 180px));
              max-width: none;
            }

            /* 5 agents: single row, can expand wider */
            .agents-collection[data-agent-count='5'] {
              grid-template-columns: repeat(5, minmax(0, 180px));
            }

            /* 6 agents: 2 rows of 3 - bigger cards */
            .agents-collection[data-agent-count='6'] {
              grid-template-columns: repeat(3, minmax(0, 220px));
            }

            /* 7-9 agents: 3 cols - bigger cards */
            .agents-collection[data-agent-count='7'],
            .agents-collection[data-agent-count='8'],
            .agents-collection[data-agent-count='9'] {
              grid-template-columns: repeat(3, minmax(0, 200px));
            }

            /* 10-12 agents: 4 cols */
            .agents-collection[data-agent-count='10'],
            .agents-collection[data-agent-count='11'],
            .agents-collection[data-agent-count='12'],
            .agents-collection[data-agent-count='13'] {
              grid-template-columns: repeat(4, minmax(0, 180px));
            }

            /* Desktop: Add button centering */
            /* Single row layouts (1-5 agents) - add button alone on row 2 */
            .agents-collection[data-agent-count='1'] .add-agent-card,
            .agents-collection[data-agent-count='2'] .add-agent-card,
            .agents-collection[data-agent-count='3'] .add-agent-card,
            .agents-collection[data-agent-count='4'] .add-agent-card,
            .agents-collection[data-agent-count='5'] .add-agent-card {
              grid-column: 1 / -1;
              justify-self: center;
              max-width: 180px;
            }

            /* 6 agents (3 cols, 2 rows) - add alone on row 3 */
            .agents-collection[data-agent-count='6'] .add-agent-card {
              grid-column: 1 / -1;
              justify-self: center;
              max-width: 180px;
            }

            /* 9 agents (3 cols, 3 rows) - add alone on row 4 */
            .agents-collection[data-agent-count='9'] .add-agent-card {
              grid-column: 1 / -1;
              justify-self: center;
              max-width: 180px;
            }

            /* 12 agents (4 cols, 3 rows) - add alone on row 4 */
            .agents-collection[data-agent-count='12'] .add-agent-card {
              grid-column: 1 / -1;
              justify-self: center;
              max-width: 160px;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .agent-card {
            position: relative;
            opacity: 1;
          }

          .agent-card-inner {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 0.5rem;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--foreground) / 0.12);
            border-radius: 0.75rem;
            transition: all 0.2s ease;
            backdrop-filter: blur(8px);
            width: 100%;
          }

          .agent-card-inner:hover {
            transform: translateY(-2px);
            border-color: hsl(var(--foreground) / 0.2);
            background: hsl(var(--card));
            box-shadow: 0 4px 16px hsl(0 0% 0% / 0.2);
          }

          .agent-remove-btn {
            position: absolute;
            top: 0.25rem;
            right: 0.25rem;
            width: 1.25rem;
            height: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: hsl(var(--muted));
            border: 1px solid hsl(var(--border));
            border-radius: 50%;
            color: hsl(var(--muted-foreground));
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10;
            opacity: 0;
          }

          .agent-card-inner:hover .agent-remove-btn {
            opacity: 1;
          }

          .agent-remove-btn svg {
            width: 0.75rem;
            height: 0.75rem;
          }

          .agent-remove-btn:hover {
            background: hsl(var(--primary) / 0.2);
            border-color: hsl(var(--primary) / 0.4);
            color: hsl(var(--primary));
            transform: scale(1.1);
          }

          .agent-action-buttons {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .agent-card-inner:hover .agent-action-buttons {
            opacity: 1;
          }

          .agent-action-btn {
            width: 1.75rem;
            height: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: hsl(var(--muted) / 0.9);
            border: 1px solid hsl(var(--border));
            border-radius: 50%;
            color: hsl(var(--muted-foreground));
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .agent-action-btn svg {
            width: 0.875rem;
            height: 0.875rem;
          }

          .agent-action-btn:hover {
            background: hsl(var(--primary) / 0.2);
            border-color: hsl(var(--primary) / 0.4);
            color: hsl(var(--primary));
            transform: scale(1.1);
          }

          .agent-avatar-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .agent-avatar-glow {
            display: none;
          }

          /* Mobile default: big beautiful cards */
          .agent-avatar {
            width: 56px;
            height: 56px;
            border: 2px solid hsl(var(--foreground) / 0.1);
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
          }

          .agent-card-inner:hover .agent-avatar {
            border-color: hsl(var(--foreground) / 0.2);
          }

          .agent-avatar-fallback {
            font-size: 1.25rem;
            font-weight: 600;
            background: hsl(var(--muted));
            color: hsl(var(--foreground) / 0.7);
          }

          .agent-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            text-align: center;
            min-width: 0;
            width: 100%;
          }

          .agent-name {
            font-size: 0.8125rem;
            font-weight: 600;
            color: hsl(var(--foreground));
            letter-spacing: -0.01em;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            transition: color 0.15s ease;
            text-decoration: none;
          }

          .agent-name:hover {
            color: hsl(var(--primary));
          }

          .agent-creator {
            font-size: 0.6875rem;
            color: hsl(var(--muted-foreground));
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .add-agent-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.375rem;
            padding: 0.5rem 0.75rem;
            width: 100%;
            min-height: 0;
            background: transparent;
            border: none;
            border-radius: 0.625rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .add-agent-card:hover {
            background: hsl(var(--muted) / 0.2);
          }

          .add-agent-icon {
            width: 2.25rem;
            height: 2.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: transparent;
            border: 1.5px dashed hsl(var(--muted-foreground) / 0.3);
            color: hsl(var(--muted-foreground) / 0.5);
            transition: all 0.2s ease;
          }

          .add-agent-card:hover .add-agent-icon {
            color: hsl(var(--muted-foreground) / 0.8);
            border-color: hsl(var(--muted-foreground) / 0.5);
            background: hsl(var(--muted) / 0.3);
          }

          .add-agent-text {
            font-size: 0.75rem;
            color: hsl(var(--muted-foreground) / 0.4);
            font-weight: 500;
          }

          .add-agent-card:hover .add-agent-text {
            color: hsl(var(--muted-foreground) / 0.7);
          }

          /* ===== ADD BUTTON CENTERING ===== */
          /* When add button is alone on its row, center it */
          /* Mobile: 3 cols - center when 3, 6, 9 agents */
          .agents-collection[data-agent-count='3'] .add-agent-card,
          .agents-collection[data-agent-count='6'] .add-agent-card,
          .agents-collection[data-agent-count='9'] .add-agent-card {
            grid-column: 1 / -1;
            justify-self: center;
            max-width: 140px;
          }

          /* Mobile: 2 cols (for 4 agents) - center when 2, 4 agents */
          .agents-collection[data-agent-count='4'] .add-agent-card {
            grid-column: 1 / -1;
            justify-self: center;
            max-width: 140px;
          }

          /* Mobile: 4 cols - center when 4, 8, 12 agents */
          .agents-collection[data-agent-count='12'] .add-agent-card {
            grid-column: 1 / -1;
            justify-self: center;
            max-width: 120px;
          }

          /* ===== MOBILE CARD SCALING ===== */

          /* Mobile: 1 agent - big card */
          .agents-collection[data-agent-count='1'] .agent-card-inner {
            padding: 1.5rem 1.25rem;
            gap: 0.75rem;
          }
          .agents-collection[data-agent-count='1'] .agent-avatar {
            width: 88px;
            height: 88px;
          }
          .agents-collection[data-agent-count='1'] .agent-avatar-fallback {
            font-size: 2.25rem;
          }
          .agents-collection[data-agent-count='1'] .agent-name {
            font-size: 1.125rem;
          }
          .agents-collection[data-agent-count='1'] .agent-creator {
            font-size: 0.875rem;
          }
          .agents-collection[data-agent-count='1'] .add-agent-card {
            padding: 0.75rem 1rem;
            gap: 0.5rem;
          }
          .agents-collection[data-agent-count='1'] .add-agent-icon {
            width: 2.75rem;
            height: 2.75rem;
          }
          .agents-collection[data-agent-count='1'] .add-agent-text {
            font-size: 0.9375rem;
          }

          /* Mobile: 2 agents - 2 cols, big cards */
          .agents-collection[data-agent-count='2'] .agent-card-inner {
            padding: 1.25rem 0.875rem;
            gap: 0.625rem;
          }
          .agents-collection[data-agent-count='2'] .agent-avatar {
            width: 72px;
            height: 72px;
          }
          .agents-collection[data-agent-count='2'] .agent-avatar-fallback {
            font-size: 1.75rem;
          }
          .agents-collection[data-agent-count='2'] .agent-name {
            font-size: 0.9375rem;
          }
          .agents-collection[data-agent-count='2'] .agent-creator {
            font-size: 0.75rem;
          }

          /* Mobile: 3 agents - 3 cols, fill width */
          .agents-collection[data-agent-count='3'] .agent-card-inner {
            padding: 1rem 0.625rem;
            gap: 0.5rem;
          }
          .agents-collection[data-agent-count='3'] .agent-avatar {
            width: 64px;
            height: 64px;
          }
          .agents-collection[data-agent-count='3'] .agent-avatar-fallback {
            font-size: 1.5rem;
          }
          .agents-collection[data-agent-count='3'] .agent-name {
            font-size: 0.8125rem;
          }
          .agents-collection[data-agent-count='3'] .agent-creator {
            font-size: 0.6875rem;
          }

          /* Mobile: 4 agents - 2x2 grid, nice cards */
          .agents-collection[data-agent-count='4'] .agent-card-inner {
            padding: 1.125rem 0.75rem;
            gap: 0.5rem;
          }
          .agents-collection[data-agent-count='4'] .agent-avatar {
            width: 68px;
            height: 68px;
          }
          .agents-collection[data-agent-count='4'] .agent-avatar-fallback {
            font-size: 1.625rem;
          }
          .agents-collection[data-agent-count='4'] .agent-name {
            font-size: 0.875rem;
          }
          .agents-collection[data-agent-count='4'] .agent-creator {
            font-size: 0.6875rem;
          }

          /* Mobile: 5-6 agents - 3 cols, fill width */
          .agents-collection[data-agent-count='5'] .agent-card-inner,
          .agents-collection[data-agent-count='6'] .agent-card-inner {
            padding: 1rem 0.625rem;
            gap: 0.5rem;
          }
          .agents-collection[data-agent-count='5'] .agent-avatar,
          .agents-collection[data-agent-count='6'] .agent-avatar {
            width: 60px;
            height: 60px;
          }
          .agents-collection[data-agent-count='5'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='6'] .agent-avatar-fallback {
            font-size: 1.5rem;
          }
          .agents-collection[data-agent-count='5'] .agent-name,
          .agents-collection[data-agent-count='6'] .agent-name {
            font-size: 0.8125rem;
          }
          .agents-collection[data-agent-count='5'] .agent-creator,
          .agents-collection[data-agent-count='6'] .agent-creator {
            font-size: 0.625rem;
          }

          /* Mobile: 7-9 agents - 3 cols */
          .agents-collection[data-agent-count='7'] .agent-card-inner,
          .agents-collection[data-agent-count='8'] .agent-card-inner,
          .agents-collection[data-agent-count='9'] .agent-card-inner {
            padding: 0.875rem 0.5rem;
            gap: 0.375rem;
          }
          .agents-collection[data-agent-count='7'] .agent-avatar,
          .agents-collection[data-agent-count='8'] .agent-avatar,
          .agents-collection[data-agent-count='9'] .agent-avatar {
            width: 52px;
            height: 52px;
          }
          .agents-collection[data-agent-count='7'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='8'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='9'] .agent-avatar-fallback {
            font-size: 1.25rem;
          }
          .agents-collection[data-agent-count='7'] .agent-name,
          .agents-collection[data-agent-count='8'] .agent-name,
          .agents-collection[data-agent-count='9'] .agent-name {
            font-size: 0.75rem;
          }
          .agents-collection[data-agent-count='7'] .agent-creator,
          .agents-collection[data-agent-count='8'] .agent-creator,
          .agents-collection[data-agent-count='9'] .agent-creator {
            font-size: 0.5625rem;
          }

          /* Mobile: 10-12 agents - 4 cols, compact */
          .agents-collection[data-agent-count='10'] .agent-card-inner,
          .agents-collection[data-agent-count='11'] .agent-card-inner,
          .agents-collection[data-agent-count='12'] .agent-card-inner,
          .agents-collection[data-agent-count='13'] .agent-card-inner {
            padding: 0.75rem 0.375rem;
            gap: 0.25rem;
          }
          .agents-collection[data-agent-count='10'] .agent-avatar,
          .agents-collection[data-agent-count='11'] .agent-avatar,
          .agents-collection[data-agent-count='12'] .agent-avatar,
          .agents-collection[data-agent-count='13'] .agent-avatar {
            width: 44px;
            height: 44px;
          }
          .agents-collection[data-agent-count='10'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='11'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='12'] .agent-avatar-fallback,
          .agents-collection[data-agent-count='13'] .agent-avatar-fallback {
            font-size: 1rem;
          }
          .agents-collection[data-agent-count='10'] .agent-name,
          .agents-collection[data-agent-count='11'] .agent-name,
          .agents-collection[data-agent-count='12'] .agent-name,
          .agents-collection[data-agent-count='13'] .agent-name {
            font-size: 0.625rem;
          }
          .agents-collection[data-agent-count='10'] .agent-creator,
          .agents-collection[data-agent-count='11'] .agent-creator,
          .agents-collection[data-agent-count='12'] .agent-creator,
          .agents-collection[data-agent-count='13'] .agent-creator {
            display: none;
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.1);
            }
          }

          /* ===== DESKTOP CARD SCALING ===== */
          @media (min-width: 768px) {
            /* Desktop defaults - tall vertical cards */
            .agent-avatar {
              width: 96px;
              height: 96px;
            }
            .agent-avatar-fallback {
              font-size: 2rem;
            }
            .agent-name {
              font-size: 1.0625rem;
            }
            .agent-creator {
              font-size: 0.875rem;
            }
            .agent-card-inner {
              padding: 2rem 1.25rem;
              gap: 1rem;
            }
            .add-agent-card {
              padding: 0.75rem 1rem;
              gap: 0.5rem;
            }
            .add-agent-icon {
              width: 2.5rem;
              height: 2.5rem;
            }
            .add-agent-text {
              font-size: 0.9375rem;
            }

            /* Desktop: 1 agent - large card with glow */
            .agents-collection[data-agent-count='1'] .agent-card-inner {
              padding: 3rem 2.5rem;
              gap: 1.5rem;
            }
            .agents-collection[data-agent-count='1'] .agent-avatar {
              width: 160px;
              height: 160px;
            }
            .agents-collection[data-agent-count='1'] .agent-avatar-fallback {
              font-size: 3.5rem;
            }
            .agents-collection[data-agent-count='1'] .agent-name {
              font-size: 1.625rem;
            }
            .agents-collection[data-agent-count='1'] .agent-creator {
              font-size: 1.0625rem;
            }
            .agents-collection[data-agent-count='1'] .agent-avatar-glow {
              display: block;
              position: absolute;
              inset: -15%;
              background: radial-gradient(
                circle,
                hsl(var(--foreground) / 0.06) 0%,
                transparent 70%
              );
              border-radius: 50%;
              animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .agents-collection[data-agent-count='1'] .add-agent-card {
              padding: 1rem 1.5rem;
              gap: 0.625rem;
            }
            .agents-collection[data-agent-count='1'] .add-agent-icon {
              width: 3rem;
              height: 3rem;
            }
            .agents-collection[data-agent-count='1'] .add-agent-text {
              font-size: 1rem;
            }

            /* Desktop: 2 agents - big tall cards */
            .agents-collection[data-agent-count='2'] .agent-card-inner {
              padding: 2.5rem 1.75rem;
              gap: 1.25rem;
            }
            .agents-collection[data-agent-count='2'] .agent-avatar {
              width: 130px;
              height: 130px;
            }
            .agents-collection[data-agent-count='2'] .agent-avatar-fallback {
              font-size: 3rem;
            }
            .agents-collection[data-agent-count='2'] .agent-name {
              font-size: 1.375rem;
            }
            .agents-collection[data-agent-count='2'] .agent-creator {
              font-size: 1rem;
            }

            /* Desktop: 3 agents - big tall cards */
            .agents-collection[data-agent-count='3'] .agent-card-inner {
              padding: 2.25rem 1.5rem;
              gap: 1.125rem;
            }
            .agents-collection[data-agent-count='3'] .agent-avatar {
              width: 115px;
              height: 115px;
            }
            .agents-collection[data-agent-count='3'] .agent-avatar-fallback {
              font-size: 2.75rem;
            }
            .agents-collection[data-agent-count='3'] .agent-name {
              font-size: 1.25rem;
            }
            .agents-collection[data-agent-count='3'] .agent-creator {
              font-size: 0.9375rem;
            }

            /* Desktop: 4 agents - tall cards with big avatars */
            .agents-collection[data-agent-count='4'] .agent-card-inner {
              padding: 2rem 1.25rem;
              gap: 1rem;
            }
            .agents-collection[data-agent-count='4'] .agent-avatar {
              width: 100px;
              height: 100px;
            }
            .agents-collection[data-agent-count='4'] .agent-avatar-fallback {
              font-size: 2.25rem;
            }
            .agents-collection[data-agent-count='4'] .agent-name {
              font-size: 1.125rem;
            }
            .agents-collection[data-agent-count='4'] .agent-creator {
              font-size: 0.875rem;
            }

            /* Desktop: 5 agents - tall cards */
            .agents-collection[data-agent-count='5'] .agent-card-inner {
              padding: 1.75rem 1rem;
              gap: 0.875rem;
            }
            .agents-collection[data-agent-count='5'] .agent-avatar {
              width: 88px;
              height: 88px;
            }
            .agents-collection[data-agent-count='5'] .agent-avatar-fallback {
              font-size: 2rem;
            }
            .agents-collection[data-agent-count='5'] .agent-name {
              font-size: 1rem;
            }
            .agents-collection[data-agent-count='5'] .agent-creator {
              font-size: 0.8125rem;
            }

            /* Desktop: 6 agents - bigger cards (2 rows of 3) */
            .agents-collection[data-agent-count='6'] .agent-card-inner {
              padding: 2rem 1.25rem;
              gap: 1rem;
            }
            .agents-collection[data-agent-count='6'] .agent-avatar {
              width: 100px;
              height: 100px;
            }
            .agents-collection[data-agent-count='6'] .agent-avatar-fallback {
              font-size: 2.25rem;
            }
            .agents-collection[data-agent-count='6'] .agent-name {
              font-size: 1.125rem;
            }
            .agents-collection[data-agent-count='6'] .agent-creator {
              font-size: 0.875rem;
            }

            /* Desktop: 7-9 agents - medium tall cards (3 cols) */
            .agents-collection[data-agent-count='7'] .agent-card-inner,
            .agents-collection[data-agent-count='8'] .agent-card-inner,
            .agents-collection[data-agent-count='9'] .agent-card-inner {
              padding: 1.75rem 1.125rem;
              gap: 0.875rem;
            }
            .agents-collection[data-agent-count='7'] .agent-avatar,
            .agents-collection[data-agent-count='8'] .agent-avatar,
            .agents-collection[data-agent-count='9'] .agent-avatar {
              width: 92px;
              height: 92px;
            }
            .agents-collection[data-agent-count='7'] .agent-avatar-fallback,
            .agents-collection[data-agent-count='8'] .agent-avatar-fallback,
            .agents-collection[data-agent-count='9'] .agent-avatar-fallback {
              font-size: 2rem;
            }
            .agents-collection[data-agent-count='7'] .agent-name,
            .agents-collection[data-agent-count='8'] .agent-name,
            .agents-collection[data-agent-count='9'] .agent-name {
              font-size: 1.0625rem;
            }
            .agents-collection[data-agent-count='7'] .agent-creator,
            .agents-collection[data-agent-count='8'] .agent-creator,
            .agents-collection[data-agent-count='9'] .agent-creator {
              font-size: 0.8125rem;
            }

            /* Desktop: 10-12+ agents - slightly smaller */
            .agents-collection[data-agent-count='10'] .agent-card-inner,
            .agents-collection[data-agent-count='11'] .agent-card-inner,
            .agents-collection[data-agent-count='12'] .agent-card-inner,
            .agents-collection[data-agent-count='13'] .agent-card-inner {
              padding: 1.25rem 0.875rem;
              gap: 0.625rem;
            }
            .agents-collection[data-agent-count='10'] .agent-avatar,
            .agents-collection[data-agent-count='11'] .agent-avatar,
            .agents-collection[data-agent-count='12'] .agent-avatar,
            .agents-collection[data-agent-count='13'] .agent-avatar {
              width: 72px;
              height: 72px;
            }
            .agents-collection[data-agent-count='10'] .agent-avatar-fallback,
            .agents-collection[data-agent-count='11'] .agent-avatar-fallback,
            .agents-collection[data-agent-count='12'] .agent-avatar-fallback,
            .agents-collection[data-agent-count='13'] .agent-avatar-fallback {
              font-size: 1.625rem;
            }
            .agents-collection[data-agent-count='10'] .agent-name,
            .agents-collection[data-agent-count='11'] .agent-name,
            .agents-collection[data-agent-count='12'] .agent-name,
            .agents-collection[data-agent-count='13'] .agent-name {
              font-size: 0.9375rem;
            }
            .agents-collection[data-agent-count='10'] .agent-creator,
            .agents-collection[data-agent-count='11'] .agent-creator,
            .agents-collection[data-agent-count='12'] .agent-creator,
            .agents-collection[data-agent-count='13'] .agent-creator {
              font-size: 0.75rem;
            }
          }

          .session-settings-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 1.0625rem;
            color: hsl(var(--muted-foreground) / 0.7);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 0.5rem;
            opacity: 1;
          }

          .session-settings-btn:hover {
            color: hsl(var(--foreground));
            background: hsl(var(--muted) / 0.3);
          }

          .session-settings-btn svg {
            opacity: 0.7;
          }

          .session-settings-btn:hover svg {
            opacity: 1;
          }

          .session-mode-selector {
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
            padding: 0.875rem 1rem;
            background: hsl(var(--card) / 0.5);
            backdrop-filter: blur(8px);
            border: 1px solid hsl(var(--foreground) / 0.1);
            border-radius: 0.75rem;
            opacity: 1;
            transition: all 0.2s ease;
            width: 100%;
            max-width: 520px;
          }

          .session-mode-compact-header {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            margin-bottom: 0.125rem;
          }

          .session-mode-label-compact {
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: hsl(var(--muted-foreground) / 0.8);
          }

          .session-mode-help-btn-compact {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background: transparent;
            border: none;
            color: hsl(var(--muted-foreground) / 0.5);
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 0.25rem;
          }

          .session-mode-help-btn-compact:hover {
            color: hsl(var(--primary));
            transform: scale(1.1);
          }

          .session-mode-segmented {
            display: flex;
            gap: 0.25rem;
            background: hsl(var(--muted) / 0.3);
            border: 1px solid hsl(var(--foreground) / 0.06);
            border-radius: 0.5rem;
            padding: 0.25rem;
            position: relative;
            width: 100%;
            max-width: 460px;
          }

          .session-mode-segment {
            flex: 1;
            padding: 0.5rem 0.75rem;
            font-size: 0.9375rem;
            font-weight: 500;
            color: hsl(var(--muted-foreground) / 0.6);
            background: transparent;
            border: 1px solid transparent;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: color 0.15s ease, background 0.15s ease,
              box-shadow 0.15s ease;
            position: relative;
            z-index: 1;
            -webkit-tap-highlight-color: transparent;
            outline: none;
          }

          .session-mode-segment:hover {
            color: hsl(var(--foreground) / 0.8);
          }

          .session-mode-segment:active,
          .session-mode-segment:focus {
            outline: none;
            background: transparent;
          }

          .session-mode-segment:focus-visible {
            outline: none;
          }

          .session-mode-segment.active {
            color: hsl(var(--foreground));
            background: hsl(var(--background));
            border: 1px solid hsl(var(--foreground) / 0.15);
            box-shadow: 0 1px 4px hsl(0 0% 0% / 0.2),
              inset 0 1px 0 hsl(var(--foreground) / 0.05);
            font-weight: 600;
          }

          .session-mode-segment-automatic {
            white-space: nowrap;
          }

          .beta-tag {
            display: inline-flex;
            align-items: center;
            margin-left: 0.375rem;
            padding: 0.125rem 0.375rem;
            font-size: 0.625rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: hsl(var(--primary));
            background: hsl(var(--primary) / 0.15);
            border: 1px solid hsl(var(--primary) / 0.3);
            border-radius: 0.25rem;
            line-height: 1.2;
          }

          .session-mode-meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            font-size: 0.875rem;
            line-height: 1.4;
          }

          .session-mode-description-compact {
            color: hsl(var(--muted-foreground) / 0.75);
            font-size: 0.875rem;
          }

          .session-mode-divider {
            color: hsl(var(--muted-foreground) / 0.3);
            font-size: 0.75rem;
            user-select: none;
          }

          .session-mode-warning-compact {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: hsl(45 100% 51% / 0.15);
            border: 1px solid hsl(45 100% 51% / 0.3);
            border-radius: 0.375rem;
            color: hsl(45 100% 60%);
            font-size: 0.8rem;
            font-weight: 600;
            white-space: nowrap;
          }

          .session-mode-warning-compact svg {
            flex-shrink: 0;
          }

          .session-mode-delay-row {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding-top: 0.375rem;
            border-top: 1px solid hsl(var(--border) / 0.2);
          }

          .session-mode-delay-row .delay-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: hsl(var(--muted-foreground) / 0.8);
            white-space: nowrap;
          }

          .session-mode-delay-select {
            height: 2rem;
            font-size: 0.9375rem;
            border-color: hsl(var(--border) / 0.4);
            background: hsl(var(--background) / 0.8);
            flex: 1;
            max-width: 140px;
          }

          .session-mode-delay-select:hover {
            border-color: hsl(var(--border));
            background: hsl(var(--background));
          }

          .message-input-section {
            max-width: 900px;
            width: 100%;
          }

          .message-input-container {
            width: 100%;
          }

          @media (max-width: 767px) {
            .chat-launchpad-content {
              padding: 1rem 0.75rem;
              gap: 1rem;
            }

            .message-input-wrapper {
              padding: 0.75rem;
            }

            /* Mobile: always show remove and action buttons */
            .agent-remove-btn {
              opacity: 1;
            }

            .agent-action-buttons {
              opacity: 1 !important;
            }
          }
        `}</style>
      </main>
    </>
  )
}

export default ChatLaunchpad
