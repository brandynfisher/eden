'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical, {
  MasonryVirtualizerHandle,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import { useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import {
  RefObject,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'

type Props = {
  query?: FeedCreationsCursorArguments
  minCols?: number
  maxCols?: number
  multiselect?: boolean
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
  showSkeleton?: boolean
  onNavigate?: (creationId: string, direction: 'prev' | 'next') => void
}

export type CreationsFeedHandle = {
  getAdjacentCreationId: (
    currentId: string,
    direction: 'prev' | 'next',
  ) => string | null
  getAllCreationIds: () => string[]
}

const CreationsFeed = forwardRef<CreationsFeedHandle, Props>(
  (
    {
      query: queryProp,
      minCols,
      maxCols,
      multiselect,
      scrollRef,
      initialScrollIndex,
      onScrollRestored,
      showSkeleton = false,
      onNavigate,
    },
    ref,
  ) => {
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

    // Use query-based feedId like profile page does, not route-based
    const feedId = useMemo(() => JSON.stringify({ queryKey }), [queryKey])

    const { items, setItems, setFetchNextPage } = useFeedStore(feedId)

    const handleItemsLoaded = (newItems: RowItem[]) => {
      setItems(newItems)
    }

    const getAdjacentCreationId = useCallback(
      (currentId: string, direction: 'prev' | 'next') => {
        const currentIndex = items.findIndex(item => item._id === currentId)
        if (currentIndex === -1) return null

        const nextIndex =
          direction === 'next' ? currentIndex + 1 : currentIndex - 1
        if (nextIndex < 0 || nextIndex >= items.length) return null

        return items[nextIndex]._id
      },
      [items],
    )

    const getAllCreationIds = useCallback(() => {
      return items.map(item => item._id)
    }, [items])

    useImperativeHandle(
      ref,
      () => ({
        getAdjacentCreationId,
        getAllCreationIds,
      }),
      [getAdjacentCreationId, getAllCreationIds],
    )

    const handleCreationClick = useCallback(
      (creation: CreationV2) => {
        if (onNavigate) {
          onNavigate(creation._id, 'next') // Direction doesn't matter for initial click
        }
      },
      [onNavigate],
    )

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
            onClick={() => handleCreationClick(item as CreationV2)}
          />
        )}
      />
    )
  },
)

CreationsFeed.displayName = 'CreationsFeed'

export default CreationsFeed
