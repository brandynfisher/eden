// Sessions header for /sessions route with double navbar structure
'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { AgentAvatarsMenu } from '@/features/sessions/components/agent-avatars-menu'
import {
  SessionSettings,
  SessionSettingsModal,
} from '@/features/sessions/components/session-settings-modal'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { SessionStatusToggle } from '@/features/sessions/components/session-status-toggle'
import { useSessionsLayoutContext } from '@/features/sessions/context/sessions-layout-context'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useSharedSessionQuery } from '@/hooks/query/use-shared-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { getCloudfrontUrl } from '@/lib/media'
import { Agent, SessionPermissionLevel, SessionType } from '@edenlabs/eden-sdk'
import {
  EditIcon,
  FileTextIcon,
  HomeIcon,
  MenuIcon,
  MessageSquarePlusIcon,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

const PlatformIcon = ({
  platform,
}: {
  platform: 'discord' | 'telegram' | 'twitter' | 'farcaster'
}) => {
  switch (platform) {
    case 'discord':
      return (
        <svg
          className="h-4 w-4 text-[#5865F2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg
          className="h-4 w-4 text-foreground shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'farcaster':
      return (
        <svg
          className="h-4 w-4 text-[#8A63D2] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 4h18v16.5h-2.25v-1.5H5.25v1.5H3V4zm2.25 2.25v9.75h13.5V6.25H5.25zm3 2.25h7.5v1.5h-7.5v-1.5zm0 3h7.5v1.5h-7.5v-1.5z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg
          className="h-4 w-4 text-[#0088cc] shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    default:
      return null
  }
}

type SessionsHeaderProps = {
  onChatClick?: () => void
  isSidebarCollapsed?: boolean
}

const SessionsHeader = ({ onChatClick }: SessionsHeaderProps) => {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthState()
  const { toast } = useToast()
  const sessionsLayoutContext = useSessionsLayoutContext()
  const artifactControls = sessionsLayoutContext?.artifactControls
  const sessionId = params?.id as string
  const { isAllowed: isSessionSettingsAllowed } = useGatedResource(
    GatedResource.SessionSettings,
  )
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    type: 'natural',
    context: '',
    conductor_prompt: '',
    delay_interval: 0,
    mention_force_reply: false,
    manna_budget_unlimited: true,
    token_budget_unlimited: true,
    turn_budget_unlimited: true,
    incognito: false,
  })

  // Check if we're on a share route
  const isShareRoute = pathname?.includes('/sessions/share/')

  // Extract share ID from pathname for share routes
  const shareId = isShareRoute
    ? pathname?.split('/sessions/share/')[1]?.split('/')[0]
    : null

  // Get shared session data for share routes
  const { data: sharedSessionData } = useSharedSessionQuery({
    shareId: shareId || '',
    enabled: !!shareId && isShareRoute,
  })

  // Get current session data only if not on share route
  const { data: session, refetch } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new' && !isShareRoute,
  })

  // Helper to check if user can manage session (owner or has editor/owner permissions)
  const canManageSession =
    session &&
    user &&
    (session.owner._id === user._id ||
      session.permission_level_for_user === SessionPermissionLevel.Editor ||
      session.permission_level_for_user === SessionPermissionLevel.Owner)
  const canOpenSessionSettings = canManageSession && isSessionSettingsAllowed

  // Update session settings when session data loads
  // IMPORTANT: Only sync from server when modal is CLOSED to avoid resetting user edits
  const hasInitializedSettings = useRef(false)

  useEffect(() => {
    if (session) {
      // Only sync settings from server if:
      // 1. This is the initial load (hasn't been initialized yet), OR
      // 2. The modal is closed (user isn't actively editing)
      if (!hasInitializedSettings.current || !isSettingsModalOpen) {
        hasInitializedSettings.current = true

        setSessionSettings({
          type: session.session_type === 'automatic' ? 'automatic' : 'natural',
          context: session.context || '',
          conductor_prompt: session.settings?.conductor_prompt || '',
          delay_interval: session.settings?.delay_interval || 0,
          mention_force_reply: session.settings?.mention_force_reply || false,
          manna_budget_unlimited: !session.budget?.manna_budget,
          manna_budget: session.budget?.manna_budget,
          token_budget_unlimited: !session.budget?.token_budget,
          token_budget: session.budget?.token_budget,
          turn_budget_unlimited: !session.budget?.turn_budget,
          turn_budget: session.budget?.turn_budget,
          incognito: session.extras?.incognito || false,
        })
      }
    }
  }, [session, isSettingsModalOpen])

  const handleNewSession = () => {
    // Create URL with current session's agents
    const agentKeys = session?.agents?.map(a => a.username || a._id).join(',')
    router.push(agentKeys ? `/chat?agent=${agentKeys}` : '/chat')
  }

  const handleHamburgerClick = () => {
    onChatClick?.()
  }

  const handleSaveSettings = async (
    settings: SessionSettings,
    agents?: Agent[],
  ) => {
    try {
      // Build request body exactly like EditSessionModal and /sessions/new
      const requestBody: {
        session_type: SessionType
        settings: {
          conductor_prompt: string
          delay_interval: number
          mention_force_reply: boolean
        }
        context?: string
        budget?: {
          manna_budget?: number
          token_budget?: number
          turn_budget?: number
        }
        extras?: {
          incognito?: boolean
        }
        agent_ids?: string[]
      } = {
        session_type:
          settings.type === 'natural'
            ? SessionType.NATURAL
            : SessionType.AUTOMATIC,
        settings: {
          conductor_prompt: settings.conductor_prompt || '',
          delay_interval: settings.delay_interval,
          mention_force_reply: settings.mention_force_reply,
        },
      }

      // Always include context to allow clearing it (empty string clears the field)
      requestBody.context = settings.context?.trim() || ''

      const budget: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      } = {}
      if (!settings.manna_budget_unlimited && settings.manna_budget) {
        budget.manna_budget = settings.manna_budget
      }
      if (!settings.token_budget_unlimited && settings.token_budget) {
        budget.token_budget = settings.token_budget
      }
      if (!settings.turn_budget_unlimited && settings.turn_budget) {
        budget.turn_budget = settings.turn_budget
      }
      if (Object.keys(budget).length > 0) {
        requestBody.budget = budget
      }

      // Add incognito to extras
      if (settings.incognito) {
        requestBody.extras = {
          incognito: true,
        }
      }

      // Add agent_ids if agents were changed
      if (agents && agents.length > 0) {
        requestBody.agent_ids = agents.map(a => a._id)
      }

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update session')
      }

      await refetch()

      toast({
        title: 'Session updated successfully!',
        description: 'Your changes have been saved.',
      })

      router.refresh()
    } catch (error) {
      console.error('Session update error:', error)
      toast({
        title: 'Error updating session',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      })
      throw error
    }
  }

  // Check if we're on the main sessions list page
  const isSessionsListPage = pathname === '/sessions'
  const showArtifactsButton =
    !isShareRoute && !isSessionsListPage && !!artifactControls?.onToggle
  const showDesktopHeader = !isSessionsListPage
  const handleNavigateToMessage = useCallback((messageId: string) => {
    const messageElement = document.querySelector(
      `[data-message-id="${messageId}"]`,
    )

    if (messageElement instanceof HTMLElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageElement.classList.add('bg-primary/10')
      setTimeout(() => {
        messageElement.classList.remove('bg-primary/10')
      }, 2000)
    }
  }, [])

  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="sessions-header md:hidden sticky z-50 top-0 flex h-12 items-center gap-2 border-b bg-background px-2">
        {/* Hamburger menu - show on mobile always, but not on share routes */}
        {!isShareRoute && (
          <button
            onClick={handleHamburgerClick}
            className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Left section - Show "Sessions" on list page, share title on share route, or agent avatars + title on individual session */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isShareRoute ? (
            <h1 className="text-lg font-semibold truncate">
              {sharedSessionData?.share?.title || 'Shared Session'}
            </h1>
          ) : isSessionsListPage ? (
            <h1 className="text-xl font-bold">Sessions</h1>
          ) : session?.agents && session.agents.length > 0 ? (
            <>
              <AgentAvatarsMenu agents={session.agents}>
                <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                  <AgentAvatars agents={session.agents} className="shrink-0" />
                </button>
              </AgentAvatarsMenu>
              {session.title && (
                <div
                  className="text-sm text-foreground truncate flex-1 text-left"
                  title={session.title}
                >
                  {session.title}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Right section - Icon buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Share route: New chat + Home buttons */}
          {isShareRoute && (
            <>
              <Link
                href="/chat"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="New chat"
              >
                <MessageSquarePlusIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Home"
              >
                <HomeIcon className="w-5 h-5" />
              </Link>
            </>
          )}

          {showArtifactsButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => artifactControls?.onToggle?.()}
              className={`h-9 w-9 ${
                artifactControls?.isOpen ? 'bg-muted/60 text-foreground' : ''
              }`}
              title="Artifacts"
              aria-label="Artifacts"
            >
              <FileTextIcon className="w-4 h-4" />
            </Button>
          )}

          {/* Status Toggle - only show for automatic sessions when user can manage */}
          {!isShareRoute &&
            canManageSession &&
            sessionId !== 'new' &&
            session.session_type === 'automatic' && (
              <SessionStatusToggle
                sessionId={sessionId}
                currentStatus={session.status}
                onStatusChange={() => {}}
                iconOnly
              />
            )}

          {/* Settings button - icon only, show for editors/owners */}
          {!isShareRoute && canOpenSessionSettings && sessionId !== 'new' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="h-9 w-9"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Share button - icon only, hide on share route, show for editors/owners */}
          {!isShareRoute && canManageSession && sessionId !== 'new' && (
            <SessionShareButton
              sessionId={sessionId}
              messages={session.messages || []}
              isOwner={session.owner._id === user?._id}
              isPublic={session.extras?.is_public}
              className="h-9 w-9 px-0"
              hideText
            />
          )}

          {/* New Chat button - icon only */}
          {!isShareRoute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewSession}
              className="h-9 w-9"
              title="New Chat"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Desktop: Single navbar */}
      {showDesktopHeader && (
        <header className="sessions-header hidden md:flex h-12 items-center gap-4 border-b bg-background px-4 flex-shrink-0">
          {/* Left section */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isShareRoute ? (
              <h1 className="text-lg font-semibold truncate">
                {sharedSessionData?.share?.title || 'Shared Session'}
              </h1>
            ) : session?.agents && session.agents.length > 0 ? (
              <>
                <AgentAvatarsMenu agents={session.agents}>
                  <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                    <div className="flex -space-x-2">
                      {session.agents.slice(0, 3).map((agent, index) => (
                        <div
                          key={agent._id}
                          className="relative w-8 h-8 rounded-full border-2 border-background overflow-hidden"
                          style={{ zIndex: session.agents.length - index }}
                        >
                          {agent.userImage ? (
                            <img
                              src={getCloudfrontUrl(agent.userImage)}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                              {agent.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {session.agents.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{session.agents.length - 3}
                      </span>
                    )}
                  </button>
                </AgentAvatarsMenu>

                {session.title && (
                  <div
                    className="text-base font-semibold truncate flex-1 max-w-[400px] text-left ml-2 flex items-center gap-2 text-foreground"
                    title={session.title}
                  >
                    <span className="truncate">{session.title}</span>
                    {session.platform && (
                      <PlatformIcon platform={session.platform} />
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {isShareRoute ? (
              <>
                <Link
                  href="/chat"
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="New chat"
                >
                  <MessageSquarePlusIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/"
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Home"
                >
                  <HomeIcon className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <>
                {showArtifactsButton && (
                  <button
                    onClick={() => artifactControls?.onToggle?.()}
                    className={`h-8 px-3 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      artifactControls?.isOpen
                        ? 'bg-muted/60 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title="Artifacts"
                  >
                    <FileTextIcon className="h-3.5 w-3.5" />
                    Artifacts
                  </button>
                )}

                {!isShareRoute &&
                  canOpenSessionSettings &&
                  sessionId !== 'new' && (
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                      title="Settings"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </button>
                  )}

                {!isShareRoute && canManageSession && sessionId !== 'new' && (
                  <SessionShareButton
                    sessionId={sessionId}
                    messages={session?.messages || []}
                    isOwner={session?.owner._id === user?._id}
                    isPublic={session?.extras?.is_public}
                    className="h-8 px-3"
                  />
                )}

                {!isShareRoute && (
                  <button
                    onClick={handleNewSession}
                    className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center gap-2"
                    title="New Chat"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    New Chat
                  </button>
                )}
              </>
            )}
          </div>
        </header>
      )}

      {/* Session Settings Modal */}
      {session && sessionId && sessionId !== 'new' && !isShareRoute && (
        <SessionSettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          settings={sessionSettings}
          onSettingsChange={setSessionSettings}
          agents={session.agents}
          sessionId={sessionId}
          sessionTitle={session.title}
          onSave={handleSaveSettings}
          minimal={false}
          onNavigateToMessage={handleNavigateToMessage}
        />
      )}
    </>
  )
}

export default SessionsHeader
