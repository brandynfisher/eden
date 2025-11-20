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
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { SessionType } from '@edenlabs/eden-sdk'
import { EditIcon, MenuIcon } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  const sessionId = params?.id as string
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    type: 'passive',
    context: '',
    conductor_prompt: '',
    delay_interval: 0,
    mention_force_reply: false,
    manna_budget_unlimited: true,
    token_budget_unlimited: true,
    turn_budget_unlimited: true,
  })

  // Check if we're on a share route
  const isShareRoute = pathname?.includes('/sessions/share/')

  // Get current session data only if not on share route
  const { data: session, refetch } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new' && !isShareRoute,
  })

  // Update session settings when session data loads
  useEffect(() => {
    if (session) {
      setSessionSettings({
        type: (session.session_type as 'passive' | 'automatic') || 'passive',
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
      })
    }
  }, [session])

  const handleNewSession = () => {
    router.push('/sessions/new')
  }

  const handleHamburgerClick = () => {
    onChatClick?.()
  }

  const handleSaveSettings = async (settings: SessionSettings) => {
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
      } = {
        session_type:
          settings.type === 'passive'
            ? SessionType.PASSIVE
            : SessionType.AUTOMATIC,
        settings: {
          conductor_prompt: settings.conductor_prompt || '',
          delay_interval: settings.delay_interval,
          mention_force_reply: settings.mention_force_reply,
        },
      }

      if (settings.context && settings.context.trim()) {
        requestBody.context = settings.context
      }

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

        {/* Left section - Show "Sessions" on list page, or agent avatars + title on individual session */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isSessionsListPage ? (
            <h1 className="text-xl font-bold">Sessions</h1>
          ) : !isShareRoute && session?.agents && session.agents.length > 0 ? (
            <>
              <AgentAvatarsMenu agents={session.agents}>
                <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                  <AgentAvatars agents={session.agents} className="shrink-0" />
                </button>
              </AgentAvatarsMenu>
              {session.title && (
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors"
                  title={session.title}
                >
                  {session.title}
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Right section - Icon buttons only (hide on share route) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Status Toggle - only show for session owner and when session exists */}
          {!isShareRoute &&
            session &&
            session.owner._id === user?._id &&
            sessionId !== 'new' && (
              <SessionStatusToggle
                sessionId={sessionId}
                currentStatus={session.status}
                onStatusChange={() => {}}
                iconOnly
              />
            )}

          {/* Share button - icon only, hide on share route */}
          {!isShareRoute &&
            session &&
            session.owner._id === user?._id &&
            sessionId !== 'new' && (
              <SessionShareButton
                sessionId={sessionId}
                messages={session.messages || []}
                isOwner={session.owner._id === user?._id}
                isPublic={session.extras?.is_public}
                className="h-9 w-9 px-0"
                hideText
              />
            )}

          {/* New Session button - icon only */}
          {!isShareRoute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewSession}
              className="h-9 w-9"
              title="New Session"
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
          onSave={handleSaveSettings}
        />
      )}
    </>
  )
}

export default SessionsHeader
