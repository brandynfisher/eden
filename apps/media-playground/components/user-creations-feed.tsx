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
  const { data: user } = useSuspenseQuery({
    queryKey: ['creators', userName],
    queryFn: () => fetcher<CreatorsGetResponse>(`/api/users/${userName}`),
  })

  const query: FeedCreationsCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      userId: user?._id || '',
    }),
    [user?._id],
  )

  const queryKey = useMemo(
    () => [['creations', user?._id], query],
    [user?._id, query],
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
