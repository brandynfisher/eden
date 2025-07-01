'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical, {
  MasonryVirtualizerHandle,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import { useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { RefObject, useMemo, useRef } from 'react'

type Props = {
  query?: FeedCreationsCursorArguments
  minCols?: number
  maxCols?: number
  multiselect?: boolean
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
  showSkeleton?: boolean
}

const CreationsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  multiselect,
  scrollRef,
  initialScrollIndex,
  onScrollRestored,
  showSkeleton = false,
}: Props) => {
  const { isSignedIn } = useAuthState()
  const virtualizerRef = useRef<MasonryVirtualizerHandle>(null)

  const defaultQuery: FeedCreationsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
    }),
    [],
  )

  const query = useMemo(() => {
    return { ...defaultQuery, ...queryProp }
  }, [defaultQuery, queryProp])

  const queryKey = useMemo(() => ['feed', 'creations', query], [query])

  // ***debug*** Remove pathname dependency to prevent refetch during modal navigation
  // Use query-based feedId like profile page does, not route-based
  const feedId = useMemo(() => JSON.stringify({ queryKey }), [queryKey])

  const { setItems, setFetchNextPage } = useFeedStore(feedId)

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  return (
    <MasonryVirtualizerVertical
      ref={virtualizerRef}
      apiEndpoint={'/api/feed/creations'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      onItemsLoaded={handleItemsLoaded}
      setFetchNextPage={setFetchNextPage}
      scrollRef={scrollRef}
      initialScrollIndex={initialScrollIndex}
      onScrollRestored={onScrollRestored}
      showSkeleton={showSkeleton}
      render={(item: RowItem, onUpdate, _index) => (
        <CreationCard
          onUpdate={onUpdate}
          creation={item as CreationV2}
          creator={(item as CreationV2).user}
          linkHref={`/creations/${item._id}`}
          multiselect={multiselect}
          isSignedIn={isSignedIn}
        />
      )}
    />
  )
}

export default CreationsFeed
