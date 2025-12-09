'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical, {
  BreakpointConfig,
  MasonryVirtualizerHandle,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useScrollContainer } from '@/contexts/scroll-container-context'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import { useCreationDetailModalStore } from '@/zustand/creation-detail-modal-store'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import {
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

type Props = {
  query?: FeedCreationsCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
  multiselect?: boolean
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
  showSkeleton?: boolean
  debugLabel?: string
}

const DEFAULT_CREATIONS_BREAKPOINTS: BreakpointConfig[] = [
  { minWidth: 1024, columns: 4 },
  { minWidth: 768, columns: 2 },
  { minWidth: 0, columns: 1 },
]

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
      breakpoints,
      multiselect,
      scrollRef,
      initialScrollIndex,
      onScrollRestored,
      showSkeleton = true,
      debugLabel,
    }: Props,
    ref,
  ) => {
    const { isSignedIn } = useAuthState()
    const queryClient = useQueryClient()
    const openCreationDetail = useCreationDetailModalStore(state => state.open)
    const layoutScrollRef = useScrollContainer()
    const virtualizerRef = useRef<MasonryVirtualizerHandle>(null)

    const defaultQuery: FeedCreationsCursorArguments = useMemo(
      () => ({
        limit: 35,
        sort: ['createdAt;-1'],
      }),
      [],
    )

    useEffect(() => {
      if (!debugLabel) return

      const source = scrollRef ? 'prop' : layoutScrollRef ? 'context' : 'none'
      const timeout = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.info(`[CreationsFeed:${debugLabel}] scrollRef`, {
          source,
          attached: Boolean((scrollRef ?? layoutScrollRef)?.current),
        })
      }, 120)

      return () => clearTimeout(timeout)
    }, [debugLabel, layoutScrollRef, scrollRef])

    const query = useMemo(() => {
      return { ...defaultQuery, ...queryProp }
    }, [defaultQuery, queryProp])

    const queryKey = useMemo(() => ['feed', 'creations', query], [query])

    // Use query-based feedId like profile page does, not route-based
    const feedId = useMemo(() => JSON.stringify({ queryKey }), [queryKey])

    const {
      items,
      setItems,
      setActiveIndex,
      setFetchNextPage,
      getScrollPosition,
      setScrollPosition,
    } = useFeedStore(feedId)
    const { addToHistory } = useActiveFeedStore()

    // Get saved scroll position and track if we've used it
    const savedScrollIndex = getScrollPosition()
    const [scrollRestored, setScrollRestored] = useState(false)

    // Only use savedScrollIndex if we haven't restored yet and it's not explicitly overridden
    const effectiveScrollIndex =
      !scrollRestored && savedScrollIndex !== null
        ? savedScrollIndex
        : initialScrollIndex ?? null

    const handleItemsLoaded = (newItems: RowItem[]) => {
      setItems(newItems)
    }

    const handleCardClick = (item: CreationV2, index: number) => {
      setActiveIndex(index)
      addToHistory(feedId)

      // Save current scroll position before navigating
      // Use the topmost visible index from the virtualizer if available
      const topmostIndex = virtualizerRef.current?.getTopmostVisibleIndex()
      if (topmostIndex !== null && topmostIndex !== undefined) {
        setScrollPosition(topmostIndex)
      } else {
        // Fallback to the clicked item's index
        setScrollPosition(index)
      }

      // Seed cache for instant thumbnail display
      queryClient.setQueryData(['creations', item._id], {
        creation: item,
      })

      // Invalidate immediately so full query runs to get complete data
      queryClient.invalidateQueries({ queryKey: ['creations', item._id] })

      openCreationDetail({ creationId: item._id, initialCreation: item })
    }

    const handleScrollRestored = useCallback(() => {
      setScrollRestored(true)
      // Clear the saved scroll position after it's been used
      setScrollPosition(null)
      onScrollRestored?.()
    }, [setScrollPosition, onScrollRestored])

    const resolvedBreakpoints = useMemo(
      () =>
        (breakpoints ?? DEFAULT_CREATIONS_BREAKPOINTS).map(bp => ({
          ...bp,
        })),
      [breakpoints],
    )

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
        minCols={minCols ?? 1}
        maxCols={maxCols || undefined}
        breakpoints={resolvedBreakpoints}
        onItemsLoaded={handleItemsLoaded}
        setFetchNextPage={setFetchNextPage}
        scrollRef={scrollRef ?? layoutScrollRef ?? undefined}
        initialScrollIndex={effectiveScrollIndex}
        onScrollRestored={handleScrollRestored}
        showSkeleton={showSkeleton}
        debugLabel={debugLabel}
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
