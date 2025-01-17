'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query/cache-updates'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { CreationV2, FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  query?: FeedCreationsCursorArguments
  minCols?: number
  maxCols?: number
  multiselect?: boolean
}

const CreationsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  multiselect,
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

  console.log(query)

  const feedId = useMemo(() => JSON.stringify(queryKey), [queryKey])
  const { setItems, setActiveIndex } = useFeedStore(feedId)
  const { setActiveFeedId } = useActiveFeedStore()

  const handleCardClick = (itemId: string, index: number) => {
    setActiveIndex(index)
    setActiveFeedId(JSON.stringify(queryKey)) // Set the active feedId
    router.push(`/creations/${itemId}`) // Navigate to the modal
  }

  const handleItemsLoaded = (newItems: RowItem[]) => {
    console.log('handleItemsLoaded', newItems)
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
