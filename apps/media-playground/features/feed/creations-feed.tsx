'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical, {
  MasonryVirtualizerHandle,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  RefObject,
  forwardRef,
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
      showSkeleton = true,
    }: Props,
    ref,
  ) => {
    const { isSignedIn } = useAuthState()
    const queryClient = useQueryClient()
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

    // Use query-based feedId like profile page does, not route-based
    const feedId = useMemo(() => JSON.stringify({ queryKey }), [queryKey])

    const { items, setItems, setActiveIndex, setFetchNextPage } =
      useFeedStore(feedId)
    const { addToHistory } = useActiveFeedStore()

    const handleItemsLoaded = (newItems: RowItem[]) => {
      setItems(newItems)
    }

    const handleCardClick = (item: CreationV2, index: number) => {
      setActiveIndex(index)
      addToHistory(feedId)

      // Seed cache for instant thumbnail display
      queryClient.setQueryData(['creations', item._id], {
        creation: item,
      })

      // Invalidate immediately so full query runs to get complete data
      queryClient.invalidateQueries({ queryKey: ['creations', item._id] })

      // Navigate to creation - modal opens via parallel route
      router.push(`/creations/${item._id}`)
    }

    // Expose navigation helpers via ref
    useImperativeHandle(
      ref,
      () => ({
        getAdjacentCreationId: (currentId, direction) => {
          if (!items || !items.length) return null
          const index = items.findIndex(
            (it: RowItem) => (it as { _id?: string })?._id === currentId,
          )
          if (index === -1) return null
          const targetIndex = direction === 'prev' ? index - 1 : index + 1
          if (targetIndex < 0 || targetIndex >= items.length) return null
          const target = items[targetIndex] as { _id?: string }
          return target?._id ?? null
        },
        getAllCreationIds: () =>
          items
            .map(it => (it as { _id?: string })?._id)
            .filter((id): id is string => Boolean(id)),
      }),
      [items],
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
        render={(item: RowItem, onUpdate, index) => (
          <CreationCard
            onUpdate={onUpdate}
            creation={item as CreationV2}
            creator={(item as CreationV2).user}
            multiselect={multiselect}
            isSignedIn={isSignedIn}
            onClick={() => handleCardClick(item as CreationV2, index)}
          />
        )}
      />
    )
  },
)

CreationsFeed.displayName = 'CreationsFeed'

export default CreationsFeed
