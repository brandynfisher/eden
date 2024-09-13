'use client'

import ModelCard from '@/components/card/model-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { RowItem } from '@/lib/query'
import { FeedConceptsCursorArguments, ModelV2 } from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

type Props = {
  query?: FeedConceptsCursorArguments
  minCols?: number
  maxCols?: number
  onClick?: (item: ModelV2) => void
}

const ModelsFeed = ({ query: queryProp, minCols, maxCols, onClick }: Props) => {
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

  return (
    <MasonryVirtualizerVertical
      key={JSON.stringify(queryKey)}
      apiEndpoint={'/api/feed/models'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      render={(item: RowItem, onUpdate) => (
        <ModelCard
          onClick={onClick}
          onUpdate={onUpdate}
          model={item as ModelV2}
          creator={(item as ModelV2).user}
          linkHref={`/models/${item._id}`}
          showFooter={true} // @todo: make this a feed prop
        />
      )}
    />
  )
}

export default ModelsFeed
