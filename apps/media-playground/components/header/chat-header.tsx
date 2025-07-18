// Chat-specific header for /chat route that combines main navbar with agent bar
import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useLastAgent } from '@/hooks/use-last-agent'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { isAgentOwner } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, MenuIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Suspense } from 'react'

type ChatHeaderProps = {
  agent: Agent | null | undefined
  onChatClick?: () => void
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  isSidebarCollapsed?: boolean
}

const ChatHeader = ({
  agent,
  onChatClick,
  onAgentSelect,
  onSettingsClick,
  isSidebarCollapsed,
}: ChatHeaderProps) => {
  const params = useParams()
  const { user } = useAuthState()
  const { getChatUrl, isHydrated } = useLastAgent()
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
      {/* Mobile: Single navbar (existing design) */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-2">
        {/* Left section - Agent controls (replaces original nav) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {agent ? (
            <>
              {/* Hamburger menu - show on mobile always */}
              <button
                onClick={handleHamburgerClick}
                className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <MenuIcon className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Agent avatar and name */}
              <button
                onClick={onAgentSelect}
                className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
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
                <span className="font-semibold text-base text-foreground truncate max-w-[200px]">
                  {agent.username}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>

              {/* Session title - only show when in an active chat */}
              {sessionId && session?.title && (
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
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="w-32 h-5 bg-muted animate-pulse rounded" />
            </div>
          )}
        </div>

        {/* Right section - original header items (no settings icon on mobile) */}
        <div className="ml-auto flex items-center gap-2 h-10">
          <Suspense fallback={<LoadingIndicator />}>
            <ErrorBoundary>
              <TaskStatusIndicator />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={<LoadingIndicator />}>
            <div className="hidden sm:block">
              <MannaBalance />
            </div>
          </Suspense>
          <Separator orientation="vertical" className="ml-1 mr-2" />
          <MyAccountButton />
        </div>
      </header>

      {/* Desktop: Two navbar design */}
      <div className="hidden md:block">
        {/* Top navbar - Eden logo + navigation links + profile/manna/notifications */}
        <header className="sticky z-50 top-0 flex h-14 items-center gap-4 border-b bg-background px-4">
          {/* Left section - Logo and navigation */}
          <div className="flex items-center gap-6">
            {/* Eden logo linking to home */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <EdenLogoBw className="w-[32px]" />
              <span className="sr-only">Eden</span>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-4">
              <Link
                href={isHydrated ? getChatUrl() : '/chat/eve'}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/explore?type=agents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/explore?type=tools"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Tools
              </Link>
            </nav>
          </div>

          {/* Right section - Profile, manna, notifications */}
          <div className="ml-auto flex items-center gap-2 h-10">
            <Suspense fallback={<LoadingIndicator />}>
              <ErrorBoundary>
                <TaskStatusIndicator />
              </ErrorBoundary>
            </Suspense>
            <Suspense fallback={<LoadingIndicator />}>
              <MannaBalance />
            </Suspense>
            <Separator orientation="vertical" className="ml-1 mr-2" />
            <MyAccountButton />
          </div>
        </header>

        {/* Bottom navbar - Agent selector + session title */}
        <header className="sticky z-40 top-14 flex h-10 items-center gap-4 border-b bg-muted/30 px-4">
          {/* Left section - Agent controls */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {agent ? (
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

                {/* Agent avatar and name */}
                <button
                  onClick={onAgentSelect}
                  className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
                >
                  <Avatar className="w-8 h-8 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {agent.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                    {agent.username}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Session title - only show when in an active chat */}
                {sessionId && session?.title && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
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
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>

          {/* Right section - Settings icon */}
          {showSettingsIcon && (
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettingsClick}
                className="h-8 w-8 hover:bg-muted/20 transition-colors"
              >
                <SettingsIcon className="size-4" />
                <span className="sr-only">Agent Settings</span>
              </Button>
            </div>
          )}
        </header>
      </div>
    </>
  )
}

export default ChatHeader
