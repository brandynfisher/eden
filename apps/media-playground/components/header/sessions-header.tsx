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
import { useEffect, useRef, useState } from 'react'

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

  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-12 items-center gap-2 border-b bg-background px-2">
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
          {!isShareRoute && canManageSession && sessionId !== 'new' && (
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
        />
      )}
    </>
  )
}

export default SessionsHeader
