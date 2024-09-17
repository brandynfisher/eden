import LoadingIndicator from '@/components/loading-indicator'
import FeedTabs from '@/features/explore/feed-tabs'
import { Suspense } from 'react'

const ExplorePage = () => {
  return (
    <div className="p-4">
      <Suspense fallback={<LoadingIndicator />}>
        <FeedTabs />
      </Suspense>
    </div>
  )
}

export default ExplorePage
