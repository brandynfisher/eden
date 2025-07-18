// Header for /explore and /create pages - similar to chat header design
import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Separator } from '@/components/ui/separator'
import { useLastAgent } from '@/hooks/use-last-agent'
import Link from 'next/link'
import { Suspense } from 'react'

const ExploreHeader = () => {
  const { getChatUrl, isHydrated } = useLastAgent()

  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-2">
        {/* Left section - Eden logo and navigation */}
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
            <div className="hidden sm:block">
              <MannaBalance />
            </div>
          </Suspense>
          <Separator orientation="vertical" className="ml-1 mr-2" />
          <MyAccountButton />
        </div>
      </header>

      {/* Desktop: Single navbar (simpler than chat since no agent selector needed) */}
      <header className="hidden md:flex sticky z-50 top-0 h-14 items-center gap-4 border-b bg-background px-4">
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
    </>
  )
}

export default ExploreHeader
