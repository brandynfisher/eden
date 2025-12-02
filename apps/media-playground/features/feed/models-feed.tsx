'use client'

import ModelCard from '@/components/card/model-card'
import MasonryVirtualizerVertical, {
  BreakpointConfig,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { useScrollContainer } from '@/contexts/scroll-container-context'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { FeedConceptsCursorArguments, ModelV2 } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/navigation'
import { ReactNode, RefObject, useMemo } from 'react'

type Props = {
  query?: FeedConceptsCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
  onClick?: (item: ModelV2) => void
  isSelectable?: boolean
  showFooterItems?: {
    name: boolean
    actions: boolean
  }
  scrollRef?: RefObject<HTMLDivElement>
  selectedIds?: string[]
  variant?: 'default' | 'creation-page'
  emptyState?: ReactNode
}

const ModelsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
  onClick,
  isSelectable,
  showFooterItems,
  scrollRef,
  selectedIds = [],
  variant = 'default',
  emptyState,
}: Props) => {
  const router = useRouter()
  const layoutScrollRef = useScrollContainer()

  const resolvedBreakpoints = useMemo<BreakpointConfig[]>(
    () =>
      breakpoints ?? [
        { minWidth: 1024, columns: 3 }, // lg and up
        { minWidth: 768, columns: 2 }, // md
        { minWidth: 0, columns: 1 }, // small
      ],
    [breakpoints],
  )

  const resolvedMinCols = useMemo(() => {
    // Allow callers to override; otherwise default to single column for small screens
    return minCols ?? 1
  }, [minCols])

  const resolvedMaxCols = useMemo(() => {
    // Keep caller maxCols if provided; otherwise cap at 3 when using the default breakpoints
    if (maxCols !== undefined) return maxCols
    return breakpoints ? undefined : 3
  }, [breakpoints, maxCols])

  const defaultQuery: FeedConceptsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
    }),
    [],
  )

  const query = useMemo(() => {
    return { ...defaultQuery, ...queryProp }
  }, [defaultQuery, queryProp])

  const queryKey = useMemo(() => ['feed', 'models', query], [query])

  // Use query-based feedId like creations feed does, not route-based
  const feedId = useMemo(() => JSON.stringify({ queryKey }), [queryKey])

  const { setItems, setActiveIndex, setFetchNextPage } = useFeedStore(feedId)
  const { addToHistory } = useActiveFeedStore()

  const handleCardClick = (item: ModelV2, index: number) => {
    if (isSelectable) {
      onClick?.(item)
      return
    }
    setActiveIndex(index)
    addToHistory(feedId) // Add current feed to history when navigating
    router.push(`/models/${item._id}`) // Navigate to the modal
  }

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  return (
    <MasonryVirtualizerVertical
      scrollRef={scrollRef ?? layoutScrollRef ?? undefined}
      key={`models_${JSON.stringify(query)}`}
      apiEndpoint={'/api/feed/models'}
      queryKey={queryKey}
      query={query}
      minCols={resolvedMinCols}
      maxCols={resolvedMaxCols}
      breakpoints={resolvedBreakpoints}
      onItemsLoaded={handleItemsLoaded}
      setFetchNextPage={setFetchNextPage}
      render={(item: RowItem, _onUpdate, index) => (
        <ModelCard
          onClick={() => handleCardClick(item as ModelV2, index)}
          isSelectable={isSelectable}
          queryKey={queryKey}
          model={item as ModelV2}
          creator={(item as ModelV2).user}
          linkHref={`/models/${item._id}`}
          showFooterItems={showFooterItems}
          isSelected={selectedIds.includes((item as ModelV2)._id)}
          variant={variant}
        />
      )}
      emptyState={emptyState}
    />
  )
}

export default ModelsFeed
