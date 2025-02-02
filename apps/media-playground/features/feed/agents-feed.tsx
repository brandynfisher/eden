'use client'

import AgentCard from '@/components/card/agent-card'
import MasonryVirtualizerVertical, {
  BreakpointConfig,
} from '@/components/masonry/masonry-virtualizer-vertical'
import AgentFormSheet from '@/features/agent/agent-form-sheet'
import { RowItem } from '@/lib/query/cache-updates'
import { useFeedStore } from '@/zustand/feed-store'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  query?: FeedAgentCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
}

const AgentsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
}: Props) => {
  const defaultQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
    }),
    [],
  )

  const queryClient = useQueryClient()

  const query = useMemo(() => {
    return { ...defaultQuery, ...queryProp }
  }, [defaultQuery, queryProp])

  const queryKey = useMemo(() => ['agents', query], [query])
  const pathname = usePathname()

  // Include pathname in feedId to differentiate between same queries in different routes
  const feedId = useMemo(
    () => JSON.stringify({ queryKey, path: pathname }),
    [queryKey, pathname],
  )

  const { setItems, setFetchNextPage } = useFeedStore(feedId)

  const handleItemsLoaded = (newItems: RowItem[]) => {
    setItems(newItems)
  }

  const onCreated = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKey as unknown as unknown[],
    })
  }

  return (
    <div className="space-y-4">
      <AgentFormSheet mode={'create'} onAction={onCreated} />
      <MasonryVirtualizerVertical
        key={JSON.stringify(queryKey)}
        apiEndpoint={'/api/feed/agents'}
        queryKey={queryKey}
        query={query}
        minCols={minCols || 2}
        maxCols={maxCols || undefined}
        breakpoints={breakpoints}
        onItemsLoaded={handleItemsLoaded}
        setFetchNextPage={setFetchNextPage}
        render={(item: RowItem) => (
          <AgentCard agent={item as Agent} queryKey={queryKey} />
        )}
      />
    </div>
  )
}

export default AgentsFeed
