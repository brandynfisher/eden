'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import {
  CreationV2,
  FeedCreationsCursorArguments,
  ModelV2,
} from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

type Props = {
  minCols?: number
  maxCols?: number
}

const CreationsFeed = ({ minCols, maxCols }: Props) => {
  const query: FeedCreationsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
    }),
    [],
  )

  const queryKey = useMemo(() => ['creations', query], [query])

  return (
    <MasonryVirtualizerVertical
      apiEndpoint={'/api/feed/creations'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      render={(item: CreationV2 | ModelV2) => (
        <CreationCard
          creation={item as CreationV2}
          creator={(item as CreationV2).user}
          linkHref={`/creations/${item._id}`}
        />
      )}
    />
  )
}

export default CreationsFeed
