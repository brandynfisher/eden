// Chat header for /chat route (threads instead of sessions)
import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useThreadQuery } from '@/hooks/query/use-thread-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Suspense } from 'react'

type ChatThreadHeaderProps = {
  agent: Agent | null | undefined
  onChatClick?: () => void
  onAgentSelect?: () => void
  isSidebarCollapsed?: boolean
  threadId?: string
}

const ChatThreadHeader = ({
  agent,
  onChatClick,
  onAgentSelect,
  isSidebarCollapsed,
  threadId: propThreadId,
}: ChatThreadHeaderProps) => {
  const params = useParams()
  const threadId = propThreadId || (params.threadId as string)

  // Additional debugging for URL params
  console.log('URL params:', params)
  console.log('Extracted threadId:', threadId)
  console.log('propThreadId:', propThreadId)

  // Get current thread data
  const {
    data: thread,
    isLoading,
    error,
  } = useThreadQuery({
    threadId: threadId,
    enabled: !!threadId,
  })

  // Debug logging
  console.log('ChatThreadHeader DEBUG:', {
    threadId,
    thread,
    threadTitle: thread?.title,
    threadDataTitle: thread?.data?.title,
    isLoading,
    error,
    fullThreadObject: JSON.stringify(thread, null, 2),
  })

  const handleThreadTitleClick = () => {
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
      {/* Left section - Agent controls (replaces original nav) */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {agent ? (
          <>
            {/* Hamburger menu - show on mobile always, on desktop only when sidebar collapsed */}
            <button
              onClick={handleHamburgerClick}
              className={`p-1 hover:bg-muted/10 rounded-lg transition-colors ${
                isSidebarCollapsed ? 'md:block' : 'md:hidden'
              } block`}
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
                  {agent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-base text-foreground truncate max-w-[200px]">
                {agent.name}
              </span>
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>

            {/* Thread title - only show when in an active thread */}
            {threadId && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <button
                  onClick={handleThreadTitleClick}
                  className="text-sm text-muted-foreground hover:text-foreground truncate flex-1 text-left transition-colors max-w-[300px]"
                  title={thread?.title || 'Loading...'}
                >
                  {thread?.title || `Thread ${threadId.slice(0, 8)}`}
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

      {/* Right section - Same as original header */}
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
  )
}

export default ChatThreadHeader
