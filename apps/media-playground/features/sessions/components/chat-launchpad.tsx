'use client'

import { MessageInput } from './message-input'
import { useAppShell } from '@/components/layout/app-shell'
import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import {
  SessionSettings,
  SessionSettingsModal,
} from '@/features/sessions/components/session-settings-modal'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { EditIcon, MenuIcon, Plus, Settings, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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

  // Session settings state
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    type: 'natural',
    context: '',
    conductor_prompt: '',
    delay_interval: 0,
    mention_force_reply: false,
    manna_budget_unlimited: true,
    token_budget_unlimited: true,
    turn_budget_unlimited: true,
    exclude_memory: false,
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

  // Initialize with agents from URL or default agent
  useEffect(() => {
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

      if (urlAgents.length > 0) {
        setSelectedAgents(urlAgents)
      }
    } else if (defaultAgent) {
      // Use default agent if no URL parameter
      setSelectedAgents([defaultAgent])
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
            exclude_memory?: boolean
          }
        } = {
          content,
          attachments,
          agent_ids: selectedAgents.map(a => a._id),
          thinking,
          session_type: sessionSettings.type, // Use session_type, not type
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

        // Add exclude_memory to extras
        if (sessionSettings.exclude_memory) {
          payload.extras = {
            ...payload.extras,
            exclude_memory: true,
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

        const result = await response.json()
        if (result.session_id) {
          // Navigate to the session
          router.push(`/sessions/${result.session_id}`)
        }
      } catch (error) {
        console.error('Error creating session:', error)
        setIsCreatingSession(false)
      }
    },
    [user, selectedAgents, router, sessionSettings],
  )

  const handleAgentsChange = (agents: Agent[]) => {
    setSelectedAgents(agents)
  }

  const removeAgent = (agentId: string) => {
    // Always keep at least one agent
    if (selectedAgents.length > 1) {
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
            <div className="agents-collection">
              {selectedAgents.map((agent, index) => {
                const isOwner = user && agent.owner?._id === user._id
                return (
                  <div
                    key={agent._id}
                    className="agent-card"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <div
                      className="agent-card-inner group"
                      onClick={() => setAgentToChange(agent)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Remove button - only show if more than one agent */}
                      {selectedAgents.length > 1 && (
                        <button
                          className="agent-remove-btn"
                          onClick={e => {
                            e.stopPropagation()
                            removeAgent(agent._id)
                          }}
                          aria-label="Remove agent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Settings button - only show for agents user owns */}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation()
                            setSettingsAgentId(agent.username || agent._id)
                          }}
                          className="absolute top-3 left-3 h-8 w-8 rounded-full bg-muted/80 hover:bg-muted z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Agent Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}

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
                        <h2 className="agent-name">{agent.name}</h2>
                        <p className="agent-creator">
                          by @{agent.owner?.username || 'anonymous'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add Agent Button - opens modal (only for preview users) */}
              {user?.featureFlags?.includes(FeatureFlag.Preview) && (
                <AgentSelectorModal
                  trigger={
                    <button className="add-agent-card">
                      <div className="add-agent-icon">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="add-agent-text">Add Agent</p>
                    </button>
                  }
                  selectedAgents={selectedAgents}
                  onChange={handleAgentsChange}
                />
              )}
            </div>

            {/* Session Settings Button */}
            <button
              className="session-settings-btn"
              onClick={() => setIsSessionSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
              <span>Session settings</span>
            </button>
          </div>

          {/* Message Input below agents */}
          <div className="message-input-section">
            <div className="message-input-container">
              <MessageInput
                sessionId="new"
                onStreamingMessage={handleSendMessage}
                enableLiveAudio={true}
                agent={selectedAgents[0]}
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
            padding: 2rem;
            gap: 2rem;
          }

          .agents-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
            max-width: 1200px;
            width: 100%;
          }

          .agents-collection {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            justify-content: center;
            align-items: flex-start;
            width: 100%;
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
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }

          .agent-card-inner {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 2rem 1.5rem;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 1.25rem;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(8px);
            min-width: 240px;
          }

          .agent-card-inner:hover {
            transform: translateY(-4px);
            border-color: hsl(var(--primary) / 0.3);
            background: hsl(var(--card));
            box-shadow: 0 8px 24px hsl(var(--primary) / 0.15);
          }

          .agent-remove-btn {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            width: 2rem;
            height: 2rem;
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
          }

          .agent-remove-btn:hover {
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
            position: absolute;
            inset: -20%;
            background: radial-gradient(
              circle,
              hsl(var(--primary) / 0.15) 0%,
              transparent 70%
            );
            border-radius: 50%;
            animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

          .agent-avatar {
            width: 120px;
            height: 120px;
            border: 2px solid hsl(var(--primary) / 0.2);
            box-shadow: 0 8px 32px hsl(var(--background) / 0.4);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            z-index: 1;
          }

          .agent-card-inner:hover .agent-avatar {
            border-color: hsl(var(--primary) / 0.4);
            box-shadow: 0 12px 48px hsl(var(--primary) / 0.2);
          }

          .agent-avatar-fallback {
            font-size: 2.5rem;
            font-weight: 600;
            background: hsl(var(--muted));
            color: hsl(var(--primary));
          }

          .agent-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            text-align: center;
          }

          .agent-name {
            font-size: 1.25rem;
            font-weight: 600;
            color: hsl(var(--foreground));
            letter-spacing: -0.01em;
            line-height: 1.3;
          }

          .agent-creator {
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground));
            font-weight: 400;
          }

          .add-agent-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 2rem 1.5rem;
            min-width: 240px;
            min-height: 240px;
            background: transparent;
            border: 1px dashed hsl(var(--border) / 0.4);
            border-radius: 1.25rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0;
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          }

          .add-agent-card:hover {
            background: hsl(var(--muted) / 0.3);
            border-color: hsl(var(--border));
            border-style: solid;
          }

          .add-agent-icon {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: transparent;
            color: hsl(var(--muted-foreground) / 0.5);
            transition: all 0.3s ease;
          }

          .add-agent-card:hover .add-agent-icon {
            color: hsl(var(--muted-foreground));
            transform: rotate(90deg);
          }

          .add-agent-text {
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground) / 0.6);
            font-weight: 500;
          }

          .add-agent-card:hover .add-agent-text {
            color: hsl(var(--muted-foreground));
          }

          .session-settings-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground) / 0.7);
            background: transparent;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 0.5rem;
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
            opacity: 0;
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

          .message-input-section {
            max-width: 900px;
            width: 100%;
          }

          .message-input-container {
            width: 100%;
          }

          @media (max-width: 768px) {
            .chat-launchpad-content {
              padding: 1.5rem 1rem;
              gap: 1.5rem;
            }

            .agents-section {
              gap: 1.5rem;
            }

            .agents-collection {
              gap: 1rem;
              flex-direction: column;
              align-items: stretch;
            }

            .agent-card-inner,
            .add-agent-card {
              min-width: unset;
              width: 100%;
              min-height: auto;
              padding: 1.25rem 1rem;
            }

            .agent-avatar {
              width: 80px;
              height: 80px;
            }

            .agent-name {
              font-size: 1.125rem;
            }

            .message-input-wrapper {
              padding: 1rem;
            }
          }
        `}</style>
      </main>
    </>
  )
}

export default ChatLaunchpad
