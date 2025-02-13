'use client'

import CreatorCard from '@/components/card/creator-card'
import MasonryVirtualizerVertical, {
  BreakpointConfig,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query/cache-updates'
import { useFeedStore } from '@/zustand/feed-store'
import { Creator, FeedCreatorsCursorArguments } from '@edenlabs/eden-sdk'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  query?: FeedCreatorsCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
}

const CreatorsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
}: Props) => {
  const defaultQuery: FeedCreatorsCursorArguments = useMemo(
    () => ({
      limit: 35,
      // sort: ['stats.userMessageCount;-1'],
    }),
    [],
  )

  const query = useMemo(() => {
    return { ...defaultQuery, ...queryProp }
  }, [defaultQuery, queryProp])

  const queryKey = useMemo(() => ['creators', query], [query])
  const pathname = usePathname()

  // Include pathname in feedId to differentiate between same queries in different routes
  const feedId = useMemo(
    () => JSON.stringify({ queryKey, path: pathname }),
    [queryKey, pathname],
  )

  const { setItems, setFetchNextPage } = useFeedStore(feedId)

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  return (
    <div className="space-y-4">
      <MasonryVirtualizerVertical
        key={JSON.stringify(queryKey)}
        apiEndpoint={'/api/feed/creators'}
        queryKey={queryKey}
        query={query}
        minCols={minCols || 2}
        maxCols={maxCols || undefined}
        breakpoints={breakpoints}
        onItemsLoaded={handleItemsLoaded}
        setFetchNextPage={setFetchNextPage}
        render={(item: RowItem) => <CreatorCard creator={item as Creator} />}
      />
    </div>
  )
}

export default CreatorsFeed
