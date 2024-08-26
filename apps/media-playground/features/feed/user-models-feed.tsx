'use client'

import ModelCard from '@/components/card/model-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { env } from '@/lib/config'
import { fetcher } from '@/lib/fetcher'
import {
  CreatorsGetResponse,
  FeedConceptsCursorArguments,
  ModelV2,
} from '@edenlabs/eden-sdk'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

type Props = {
  userName: string
  minCols?: number
  maxCols?: number
}

const UserModelsFeed = ({ userName, minCols, maxCols }: Props) => {
  const { data } = useSuspenseQuery({
    queryKey: ['creators', userName],
    queryFn: () =>
      fetcher<CreatorsGetResponse>(
        `${env.NEXT_PUBLIC_HOST}/api/users/${userName}`,
      ),
  })

  const query: FeedConceptsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      user: data?.creator?._id || '',
    }),
    [data?.creator?._id],
  )

  const queryKey = useMemo(() => ['models', query], [query])

  return (
    <MasonryVirtualizerVertical
      apiEndpoint={'/api/feed/models'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      render={(item: ModelV2, onUpdate) => (
        <ModelCard
          onUpdate={onUpdate}
          model={item}
          creator={item.user}
          linkHref={`/models/${item._id}`}
          showFooter={true}
        />
      )}
    />
  )
}

export default UserModelsFeed
