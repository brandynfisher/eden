// Sessions header for /sessions route with double navbar structure
'use client'

import AgentPopoverContent from '@/components/header/agent-popover'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { EditSessionModal } from '@/features/sessions/components/edit-session-modal'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { SessionStatusToggle } from '@/features/sessions/components/session-status-toggle'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { EditIcon, MenuIcon } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

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
  const sessionId = params?.id as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Check if we're on a share route
  const isShareRoute = pathname?.includes('/sessions/share/')

  // Get current session data only if not on share route
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new' && !isShareRoute,
  })

  const handleNewSession = () => {
    router.push('/sessions/new')
  }

  const handleHamburgerClick = () => {
    onChatClick?.()
  }

  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-2 border-b bg-background px-2">
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

        {/* Left section - Agent avatars and session title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Agent avatars and session title - only show if not share route */}
          {!isShareRoute && session?.agents && session.agents.length > 0 ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors shrink-0">
                    <AgentAvatars
                      agents={session.agents}
                      className="shrink-0"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <AgentPopoverContent agents={session.agents} />
                </PopoverContent>
              </Popover>
              {session.title && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
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

      {/* Edit Session Modal */}
      {session && sessionId && sessionId !== 'new' && !isShareRoute && (
        <EditSessionModal
          sessionId={sessionId}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </>
  )
}

export default SessionsHeader
