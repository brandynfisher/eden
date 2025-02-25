'use client'

import CreationsFeed from '@/features/feed/creations-feed'
import { CreationsFilter } from '@/features/feed/creations-filter'
import { FeedCreationsCursorArguments } from '@edenlabs/eden-sdk'
import { useState } from 'react'

const SortCreationsFeed = () => {
  const initialCreationsFilter = {
    collection: process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID,
  }
  const [filter, setFilter] = useState<FeedCreationsCursorArguments>(
    initialCreationsFilter,
  )

  return (
    <>
      <div className="flex items-center mb-6 gap-x-2">
        <CreationsFilter
          onChange={filter =>
            setFilter(
              (filter ??
                initialCreationsFilter) as FeedCreationsCursorArguments,
            )
          }
          initialFilter={initialCreationsFilter}
        />
      </div>

      <CreationsFeed
        query={{
          ...filter,
        }}
        minCols={2}
        maxCols={8}
      />
    </>
  )
}

export default SortCreationsFeed
