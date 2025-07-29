// Chat-specific header for /chat route that combines main navbar with agent bar
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { isAgentOwner } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import {
  ChevronRightIcon,
  MenuIcon,
  MessageCircleIcon,
  SettingsIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'

type ChatHeaderProps = {
  agent: Agent | null | undefined
  onChatClick?: () => void
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  isSidebarCollapsed?: boolean
  onSidebarToggle?: () => void
  viewMode?: string
  onBackToChat?: () => void
}

const ChatHeader = ({
  agent,
  onChatClick,
  onAgentSelect,
  onSettingsClick,
  isSidebarCollapsed,
  onSidebarToggle,
  viewMode,
  onBackToChat,
}: ChatHeaderProps) => {
  const params = useParams()
  const { user } = useAuthState()
  const sessionId = params?.id as string

  // Get current session data
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

  const showSettingsIcon = agent && isAgentOwner(agent, user?._id)

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
      {/* Mobile: Single navbar layout - Hamburger + Agent + Session title + HeaderActions */}
      <div className="md:hidden sticky z-50 top-0 bg-background border-b">
        <header className="flex h-14 items-center gap-2 px-2">
          {/* Left section - Hamburger + Agent info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Hamburger menu - always show on mobile */}
            <button
              onClick={handleHamburgerClick}
              className="p-1 hover:bg-muted/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <MenuIcon className="w-5 h-5 text-muted-foreground" />
            </button>

            {agent ? (
              <button
                onClick={onAgentSelect}
                className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0 flex-shrink-0"
              >
                <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <AvatarImage
                    src={
                      agent.userImage && agent.userImage.trim()
                        ? getCloudfrontOriginalUrl(agent.userImage)
                        : undefined
                    }
                    alt={agent.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {agent.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-foreground truncate max-w-[120px]">
                  {agent.username}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="w-20 h-5 bg-muted animate-pulse rounded" />
              </div>
            )}

            {/* Session title or back navigation */}
            {viewMode !== 'chat'
              ? // When in settings/other views, show navigation back to chat
                // Only show if we have an active session, otherwise hide text (New Chat icon will be in settings tabs)
                sessionId &&
                session?.title && (
                  <button
                    onClick={onBackToChat}
                    className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors min-w-0"
                  >
                    {session.title}
                  </button>
                )
              : // When in chat mode, show session title if available
                sessionId &&
                session?.title && (
                  <button
                    onClick={handleSessionTitleClick}
                    className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors min-w-0"
                    title={session.title}
                  >
                    {session.title}
                  </button>
                )}
          </div>

          {/* Right section - HeaderActions only (settings gear hidden on mobile) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share button */}
            {session && session.owner._id === user?._id && (
              <SessionShareButton
                sessionId={sessionId}
                messages={session.messages || []}
                isOwner={session.owner._id === user?._id}
                className="h-9 w-auto px-2"
              />
            )}
            <HeaderActions hideMannaMobile />
          </div>
        </header>
      </div>

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

        {/* Bottom navbar - Agent selector + session title */}
        <header className="sticky z-40 top-14 flex h-12 items-center gap-4 border-b bg-muted/30 px-4 py-2">
          {/* Left section - Agent controls */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {agent ? (
              <>
                {/* Hamburger menu - always show on desktop for sidebar toggle */}
                <button
                  onClick={onSidebarToggle || handleHamburgerClick}
                  className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <MenuIcon className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Agent avatar and name */}
                <button
                  onClick={onAgentSelect}
                  className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
                >
                  <Avatar className="w-9 h-9 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-sm font-medium">
                      {agent.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-foreground truncate max-w-[200px]">
                    {agent.username}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Session title or back navigation */}
                {viewMode !== 'chat'
                  ? // When in settings/other views, show navigation back to chat
                    sessionId &&
                    session?.title && (
                      <>
                        <Separator orientation="vertical" className="h-7" />
                        <button
                          onClick={onBackToChat}
                          className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors max-w-[400px]"
                        >
                          {session.title}
                        </button>
                      </>
                    )
                  : // When in chat mode, show session title if available
                    sessionId &&
                    session?.title && (
                      <>
                        <Separator orientation="vertical" className="h-7" />
                        <button
                          onClick={handleSessionTitleClick}
                          className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors max-w-[400px]"
                          title={session.title}
                        >
                          {session.title}
                        </button>
                      </>
                    )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                <div className="w-32 h-5 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>

          {/* Right section - New Chat icon (when sidebar collapsed) and Settings icon */}
          <div className="ml-auto flex items-center gap-2">
            {/* Share button */}
            {session && session.owner._id === user?._id && (
              <SessionShareButton
                sessionId={sessionId}
                messages={session.messages || []}
                isOwner={session.owner._id === user?._id}
                className="h-9 w-auto px-3"
              />
            )}

            {/* New Chat button - only show when sidebar is collapsed */}
            {isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Navigate to new chat for this agent
                  window.location.href = `/chat/${params?.agentId || 'eve'}`
                }}
                className="h-9 w-9 hover:bg-muted/20 transition-colors"
              >
                <MessageCircleIcon className="size-4" />
                <span className="sr-only">New Chat</span>
              </Button>
            )}

            {/* Settings icon */}
            {showSettingsIcon && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettingsClick}
                className="h-9 w-9 hover:bg-muted/20 transition-colors"
              >
                <SettingsIcon className="size-4" />
                <span className="sr-only">Agent Settings</span>
              </Button>
            )}
          </div>
        </header>
      </div>
    </>
  )
}

export default ChatHeader
