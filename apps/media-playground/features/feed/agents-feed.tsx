'use client'

import AgentCard from '@/components/card/agent-card'
import GridVirtualizerVertical from '@/components/grid/grid-virtualizer-vertical'
import { BreakpointConfig } from '@/components/masonry/masonry-virtualizer-vertical'
import { Button } from '@/components/ui/button'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import { RowItem } from '@/lib/query/cache-updates'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useFeedStore } from '@/zustand/feed-store'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { RefObject, useMemo } from 'react'

type Props = {
  query?: FeedAgentCursorArguments
  minCols?: number
  maxCols?: number
  breakpoints?: BreakpointConfig[]
  hideCreateButton?: boolean
  onClick?: (agent: Agent) => void
  isSelectable?: boolean
  selectedIds?: string[]
  scrollRef?: RefObject<HTMLDivElement>
  hideContextMenu?: boolean
  improvedLayout?: boolean
}

const AgentsFeed = ({
  query: queryProp,
  minCols,
  maxCols,
  breakpoints,
  hideCreateButton = false,
  onClick,
  isSelectable = false,
  selectedIds = [],
  scrollRef,
  hideContextMenu = false,
  improvedLayout = false,
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

  // Check URL params directly for ownership filter
  const searchParams = new URLSearchParams(window.location.search)
  const ownershipFilter = searchParams.get('ownership')
  const isSharedFilter = ownershipFilter === 'shared'
  
  // Use shared agents query when filtering for shared agents
  const { sharedAgents, isLoading: isSharedLoading } = useSharedAgentsQuery({ 
    enabled: isSharedFilter 
  })

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

  // Render shared agents as a simple grid
  if (isSharedFilter) {
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
        {isSharedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : sharedAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sharedAgents.map(({ agent }) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                queryKey={queryKey}
                onClick={isSelectable ? onClick : undefined}
                isSelected={
                  isSelectable && selectedIds.includes(agent._id)
                }
                className={
                  isSelectable && selectedIds.includes(agent._id)
                    ? 'ring-2 ring-primary ring-offset-2'
                    : undefined
                }
                hideContextMenu={hideContextMenu}
                improvedLayout={improvedLayout}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No agents have been shared with you yet.
          </div>
        )}
      </div>
    )
  }

  // Regular agents feed using virtualized grid
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
        scrollRef={scrollRef}
        render={(item: RowItem) => (
          <AgentCard
            agent={item as Agent}
            queryKey={queryKey}
            onClick={isSelectable ? onClick : undefined}
            isSelected={
              isSelectable && selectedIds.includes((item as Agent)._id)
            }
            className={
              isSelectable && selectedIds.includes((item as Agent)._id)
                ? 'ring-2 ring-primary ring-offset-2'
                : undefined
            }
            hideContextMenu={hideContextMenu}
            improvedLayout={improvedLayout}
          />
        )}
      />
    </div>
  )
}

export default AgentsFeed
