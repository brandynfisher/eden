'use client'

import CreationCard from '@/components/card/creation-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { env } from '@/lib/config'
import { fetcher } from '@/lib/fetcher'
import { RowItem } from '@/lib/query'
import {
  CreationV2,
  CreatorsGetResponse,
  FeedCreationsCursorArguments,
} from '@edenlabs/eden-sdk'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

type Props = {
  userName: string
  minCols?: number
  maxCols?: number
}

const UserCreationsFeed = ({ userName, minCols, maxCols }: Props) => {
  const { data } = useSuspenseQuery({
    queryKey: ['creators', userName],
    queryFn: () =>
      fetcher<CreatorsGetResponse>(
        `${env.NEXT_PUBLIC_HOST}/api/users/${userName}`,
      ),
  })

  const query: FeedCreationsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      user: data?.creator?._id || '',
    }),
    [data?.creator?._id],
  )

  const queryKey = useMemo(() => ['creations', query], [query])

  return (
    <MasonryVirtualizerVertical
      apiEndpoint={'/api/feed/creations'}
      queryKey={queryKey}
      query={query}
      minCols={minCols || 2}
      maxCols={maxCols || undefined}
      render={(item: RowItem, onUpdate) => (
        <CreationCard
          onUpdate={onUpdate}
          creation={item as CreationV2}
          creator={(item as CreationV2).user}
          linkHref={`/creations/${item._id}`}
        />
      )}
    />
  )
}

export default UserCreationsFeed
