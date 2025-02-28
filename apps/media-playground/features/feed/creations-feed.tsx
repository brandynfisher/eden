'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { usePathname, useRouter } from 'next/navigation'
import { RefObject, useMemo } from 'react'

type Props = {
  query?: FeedCreationsCursorArguments
  minCols?: number
  maxCols?: number
  multiselect?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

const CreationsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  multiselect,
  scrollRef,
}: Props) => {
  const router = useRouter()
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

  const queryKey = useMemo(() => ['creations', query], [query])
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
    router.push(`/creations/${itemId}`) // Navigate to the modal
  }

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  return (
    <MasonryVirtualizerVertical
      key={JSON.stringify(queryKey)}
      apiEndpoint={'/api/feed/creations'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      onItemsLoaded={handleItemsLoaded}
      setFetchNextPage={setFetchNextPage}
      scrollRef={scrollRef}
      render={(item: RowItem, onUpdate, index) => (
        <CreationCard
          onUpdate={onUpdate}
          creation={item as CreationV2}
          creator={(item as CreationV2).user}
          linkHref={`/creations/${item._id}`}
          multiselect={multiselect}
          onClick={() => handleCardClick(item._id, index)}
        />
      )}
    />
  )
}

export default CreationsFeed
