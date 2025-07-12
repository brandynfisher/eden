// Sessions header for /sessions route (Eden logo instead of agent selector)
import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Separator } from '@/components/ui/separator'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Suspense } from 'react'

type SessionsHeaderProps = {
  onChatClick?: () => void
  isSidebarCollapsed?: boolean
}

const SessionsHeader = ({
  onChatClick,
  isSidebarCollapsed,
}: SessionsHeaderProps) => {
  const params = useParams()
  const sessionId = params?.id as string

  // Get current session data
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

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
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-2 md:px-4">
      {/* Left section - Eden logo and session title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Hamburger menu - show on mobile always, on desktop only when sidebar collapsed */}
        <button
          onClick={handleHamburgerClick}
          className={`p-2 hover:bg-muted/10 rounded-lg transition-colors ${
            isSidebarCollapsed ? 'md:block' : 'md:hidden'
          } block`}
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Eden logo - links to home */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-2 py-1 transition-all duration-200 hover:scale-[1.02]"
        >
          <EdenLogoBw className="w-8 h-8" />
          <span className="sr-only">Eden2.0</span>
        </Link>

        {/* Session title - only show when in an active session */}
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
      </div>

      {/* Right section - Same as original header */}
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
  )
}

export default SessionsHeader
