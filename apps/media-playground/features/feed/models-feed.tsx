'use client'

import ModelCard from '@/components/card/model-card'
import MasonryVirtualizerVertical, {
  BreakpointConfig,
} from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { FeedConceptsCursorArguments, ModelV2 } from '@edenlabs/eden-sdk'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

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
}

const ModelsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
  onClick,
  isSelectable,
  showFooterItems,
}: Props) => {
  const router = useRouter()

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

  const queryKey = useMemo(() => ['models', query], [query])
  const pathname = usePathname()

  // Include pathname in feedId to differentiate between same queries in different routes
  const feedId = useMemo(
    () => JSON.stringify({ queryKey, path: pathname }),
    [queryKey, pathname],
  )

  const { setItems, setActiveIndex, setFetchNextPage } = useFeedStore(feedId)
  const { addToHistory } = useActiveFeedStore()

  const handleCardClick = (item: ModelV2, index: number) => {
    console.log('isSelectable', isSelectable)
    if (isSelectable) {
      onClick?.(item)
      return
    }
    console.log('here')
    setActiveIndex(index)
    addToHistory(feedId) // Add current feed to history when navigating
    router.push(`/models/${item._id}`) // Navigate to the modal
  }

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  return (
    <MasonryVirtualizerVertical
      key={JSON.stringify(queryKey)}
      apiEndpoint={'/api/feed/models'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      breakpoints={breakpoints}
      onItemsLoaded={handleItemsLoaded}
      setFetchNextPage={setFetchNextPage}
      render={(item: RowItem, onUpdate, index) => (
        <ModelCard
          onClick={() => handleCardClick(item as ModelV2, index)}
          isSelectable={isSelectable}
          queryKey={queryKey}
          model={item as ModelV2}
          creator={(item as ModelV2).user}
          linkHref={`/models/${item._id}`}
          showFooterItems={showFooterItems}
        />
      )}
    />
  )
}

export default ModelsFeed
