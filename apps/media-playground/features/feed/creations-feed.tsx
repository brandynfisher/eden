'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical, {
  MasonryVirtualizerHandle,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
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
  const pathname = usePathname()

  // Include pathname in feedId to differentiate between same queries in different routes
  const feedId = useMemo(
    () => JSON.stringify({ queryKey, path: pathname }),
    [queryKey, pathname],
  )

  const { setItems, setActiveIndex, setFetchNextPage } = useFeedStore(feedId)
  const { addToHistory } = useActiveFeedStore()

  const handleCardClick = (itemId: string, index: number) => {
    setActiveIndex(index)
    addToHistory(feedId) // Add current feed to history when navigating

    // Get index from the child component via ref
    const topIndex = virtualizerRef.current?.getTopmostVisibleIndex()
    const targetUrl = `/creations/${itemId}`

    // Save index to history state BEFORE navigating
    if (typeof topIndex === 'number') {
      try {
        const currentState = window.history.state || {}
        const newState = { ...currentState, scrollIndex: topIndex } // Use scrollIndex
        window.history.replaceState(newState, '')
        // console.log(
        //   `[CreationsFeed] Replaced history state with scrollIndex: ${topIndex}`,
        // )
      } catch (e) {
        console.error('Error manipulating history state:', e)
      }
    }
    // Add logging if topIndex is NOT a number
    else {
      // console.log(
      //   `[CreationsFeed] Did not save scrollIndex. topIndex result was: ${topIndex} (type: ${typeof topIndex})`,
      // )
    }

    router.push(targetUrl) // Navigate to the modal (URL has no params)
  }

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
      render={(item: RowItem, onUpdate, index) => (
        <CreationCard
          onUpdate={onUpdate}
          creation={item as CreationV2}
          creator={(item as CreationV2).user}
          linkHref={`/creations/${item._id}`}
          multiselect={multiselect}
          onClick={() => handleCardClick(item._id, index)}
          isSignedIn={isSignedIn}
        />
      )}
    />
  )
}

export default CreationsFeed
