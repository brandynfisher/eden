'use client'

import AgentCard from '@/components/card/agent-card'
import GridVirtualizerVertical from '@/components/grid/grid-virtualizer-vertical'
import { BreakpointConfig } from '@/components/masonry/masonry-virtualizer-vertical'
import { Button } from '@/components/ui/button'
import { RowItem } from '@/lib/query/cache-updates'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useFeedStore } from '@/zustand/feed-store'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  query?: FeedAgentCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
  hideCreateButton?: boolean
}

const AgentsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
  hideCreateButton = false,
}: Props) => {
  const dispatch = useAppDispatch()
  const defaultQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['stats.userMessageCount_7d;-1'],
    }),
    [],
  )

  const queryClient = useQueryClient()

  const query = useMemo(() => {
    return { ...defaultQuery, ...queryProp }
  }, [defaultQuery, queryProp])

  const queryKey = useMemo(() => ['feed', 'agents', query], [query])
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

  const handleCreateClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'create',
        onAction: onCreated,
      }),
    )
  }

  return (
    <div className="space-y-4">
      {!hideCreateButton && (
        <Button
          onClick={handleCreateClick}
          variant="outline"
          className="gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600"
        >
          <PlusIcon className="size-4" />
          Create Agent
        </Button>
      )}
      <GridVirtualizerVertical
        key={JSON.stringify({ queryKey, breakpoints })}
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
