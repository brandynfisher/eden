'use client'

import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import { fetcher } from '@/lib/fetcher'
import {
  CreatorsGetResponse,
  FeedCreationsCursorArguments,
} from '@edenlabs/eden-sdk'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

type Props = {
  userName: string
}

const UserCreationsFeed = ({ userName }: Props) => {
  const { data } = useSuspenseQuery({
    queryKey: ['creators', userName],
    queryFn: () => fetcher<CreatorsGetResponse>(`/api/users/${userName}`),
  })

  const query: FeedCreationsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      userId: data?.creator?._id || '',
    }),
    [data?.creator?._id],
  )

  const queryKey = useMemo(
    () => [['creations', data?.creator?._id], query],
    [data?.creator?._id, query],
  )

  return (
    <MasonryVirtualizerVertical
      apiEndpoint={'/api/feed/creations'}
      queryKey={queryKey}
      query={query}
      render={() => <div>render comp</div>}
    />
  )
}

export default UserCreationsFeed
