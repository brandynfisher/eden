// Sessions header for /sessions route with double navbar structure
'use client'

import AgentPopoverContent from '@/components/header/agent-popover'
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { EditSessionModal } from '@/features/sessions/components/edit-session-modal'
import { SessionBudget } from '@/features/sessions/components/session-budget'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { EditIcon, MenuIcon, Settings2Icon } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

// Sessions header for /sessions route with double navbar structure

type SessionsHeaderProps = {
  onChatClick?: () => void
  isSidebarCollapsed?: boolean
}

const SessionsHeader = ({
  onChatClick,
  isSidebarCollapsed,
}: SessionsHeaderProps) => {
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

  const handleSessionTitleClick = () => {
    // Check if we're on mobile (window width < 768px for md breakpoint)
    const isMobile = window.innerWidth < 768

    // Only open sidebar if:
    // 1. We're on mobile (sidebar is never visible on mobile), OR
    // 2. We're on desktop but sidebar is collapsed
    if (isMobile || isSidebarCollapsed) {
      onChatClick?.()
    }
    // If we're on desktop and sidebar is visible, do nothing
  }

  const handleHamburgerClick = () => {
    onChatClick?.()
  }

  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-2">
        {/* Left section - Agent avatars and session title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Hamburger menu - show on mobile always, but not on share routes */}
          {!isShareRoute && (
            <button
              onClick={handleHamburgerClick}
              className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {/* Agent avatars and session title - only show if not share route */}
          {!isShareRoute && session?.agents && session.agents.length > 0 ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors">
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
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <button
                    onClick={handleSessionTitleClick}
                    className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors max-w-[300px]"
                    title={session.title}
                  >
                    {session.title}
                  </button>
                </>
              )}
            </>
          ) : !isShareRoute && sessionId === 'new' ? (
            /* Show New Session button only on /sessions/new */
            <Button
              variant="outline"
              onClick={handleNewSession}
              className="flex justify-start gap-2 py-2 rounded-md font-medium transition-colors bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground"
            >
              <EditIcon className="size-4" />
              <span>New Session</span>
            </Button>
          ) : null}
        </div>

        {/* Right section - Edit, Budget and profile items (hide on share route) */}
        <div className="ml-auto flex items-center gap-2 h-10">
          {/* Edit button - only show for session owner */}
          {!isShareRoute && session && session.owner._id === user?._id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="h-9 w-auto px-2"
              title="Edit session"
            >
              <Settings2Icon className="w-4 h-4" />
            </Button>
          )}
          {/* Share button - hide on share route */}
          {!isShareRoute && session && session.owner._id === user?._id && (
            <SessionShareButton
              sessionId={sessionId}
              messages={session.messages || []}
              isOwner={session.owner._id === user?._id}
              isPublic={session.extras?.is_public}
              className="h-9 w-auto px-2"
            />
          )}
          {!isShareRoute && session?.budget && (
            <div className="mx-1">
              <SessionBudget budget={session.budget} />
            </div>
          )}
          <HeaderActions hideMannaMobile className="flex items-center gap-2" />
        </div>
      </header>

      {/* Desktop: Two navbar design */}
      <div className="hidden md:block">
        {/* Top navbar - Eden logo + navigation links + profile/manna/notifications */}
        <header className="sticky z-50 top-0 flex h-14 items-center gap-4 border-b bg-background px-4">
          {/* Left section - Logo and navigation */}
          <div className="flex items-center gap-6">
            <HeaderLogo />
            <HeaderNavLinks />
          </div>

          {/* Right section - Profile, manna, notifications */}
          <HeaderActions />
        </header>

        {/* Bottom navbar - Agent avatars + session title + budget + agents dropdown */}
        {/* Hide secondary navbar on desktop when on /sessions/new OR on share routes */}
        {!(sessionId === 'new' || !sessionId || isShareRoute) && (
          <header className="sticky z-40 top-14 flex h-12 items-center gap-4 border-b bg-muted/30 px-4 py-2">
            {/* Left section - Agent avatars and session title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {session?.agents && session.agents.length > 0 ? (
                <>
                  {/* Hamburger menu - show only when sidebar collapsed */}
                  {isSidebarCollapsed && (
                    <button
                      onClick={handleHamburgerClick}
                      className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
                      aria-label="Open sidebar"
                    >
                      <MenuIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}

                  {/* Agent avatars - clickable to show dropdown */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-colors">
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

                  {/* Session title */}
                  {session.title && (
                    <>
                      <Separator orientation="vertical" className="h-7" />
                      <button
                        onClick={handleSessionTitleClick}
                        className="text-base text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors max-w-[400px]"
                        title={session.title}
                      >
                        {session.title}
                      </button>
                    </>
                  )}
                </>
              ) : sessionId === 'new' ? (
                <div className="flex items-center gap-3">
                  {/* Hamburger menu - show only when sidebar collapsed */}
                  {isSidebarCollapsed && (
                    <button
                      onClick={handleHamburgerClick}
                      className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
                      aria-label="Open sidebar"
                    >
                      <MenuIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                  {/* Show New Session button only on /sessions/new */}
                  <Button
                    variant="outline"
                    onClick={handleNewSession}
                    className="flex justify-start gap-2 py-2 rounded-md font-medium transition-colors bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary text-primary-foreground"
                  >
                    <EditIcon className="size-4" />
                    <span>New Session</span>
                  </Button>
                </div>
              ) : (
                /* Show loading state or empty state for existing sessions */
                <div className="flex items-center gap-3">
                  {isSidebarCollapsed && (
                    <button
                      onClick={handleHamburgerClick}
                      className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
                      aria-label="Open sidebar"
                    >
                      <MenuIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                  {/* Loading state for existing sessions */}
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                  <div className="w-32 h-5 bg-muted animate-pulse rounded" />
                </div>
              )}
            </div>

            {/* Right section - Edit, Budget, Share buttons */}
            <div className="flex items-center gap-2">
              {/* Edit button - only show for session owner */}
              {session && session.owner._id === user?._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-9 w-auto px-3"
                  title="Edit session"
                >
                  <Settings2Icon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {/* Share button */}
              {session && session.owner._id === user?._id && (
                <SessionShareButton
                  sessionId={sessionId}
                  messages={session.messages || []}
                  isOwner={session.owner._id === user?._id}
                  isPublic={session.extras?.is_public}
                  className="h-9 w-auto px-3"
                />
              )}
              {session?.budget && (
                <div className="mx-1">
                  <SessionBudget budget={session.budget} />
                </div>
              )}
            </div>
          </header>
        )}
      </div>

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
