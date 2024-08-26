'use client'

import ModelCard from '@/components/card/model-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query'
import { FeedConceptsCursorArguments, ModelV2 } from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

type Props = {
  minCols?: number
  maxCols?: number
}

const ModelsFeed = ({ minCols, maxCols }: Props) => {
  const query: FeedConceptsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
    }),
    [],
  )

  const queryKey = useMemo(() => ['models', query], [query])

  return (
    <MasonryVirtualizerVertical
      apiEndpoint={'/api/feed/models'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      render={(item: RowItem, onUpdate) => (
        <ModelCard
          onUpdate={onUpdate}
          model={item as ModelV2}
          creator={(item as ModelV2).user}
          linkHref={`/models/${item._id}`}
          showFooter={true}
        />
      )}
    />
  )
}

export default ModelsFeed
