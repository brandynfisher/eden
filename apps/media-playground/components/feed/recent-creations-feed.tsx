import ErrorBoundary from '@/components/error-boundary'
import CreationsFeed from '@/features/feed/creations-feed'
import { RefObject, Suspense } from 'react'

type Props = {
  query: Record<string, string>
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
}

export default function RecentCreationsFeed({
  query,
  scrollRef,
  initialScrollIndex,
  onScrollRestored,
}: Props) {
  return (
    <div className="w-full px-2 sm:px-4">
      <Suspense fallback={null}>
        <ErrorBoundary>
          <CreationsFeed
            query={query}
            maxCols={5}
            scrollRef={scrollRef}
            initialScrollIndex={initialScrollIndex}
            onScrollRestored={onScrollRestored}
            showSkeleton
          />
        </ErrorBoundary>
      </Suspense>
    </div>
  )
}
