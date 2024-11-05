'use client'

import AssistantCard from '@/components/card/assistant-card'
import MasonryVirtualizerVertical from '@/components/masonry/masonry-virtualizer-vertical'
import CreateAssistantSheet from '@/features/assistant/create-assistant-sheet'
import { RowItem } from '@/lib/query/cache-updates'
import { Agent, FeedAgentsCursorArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

type Props = {
  query?: FeedAgentsCursorArguments
  minCols?: number
  maxCols?: number
}

const AssistantsFeed = ({ query: queryProp, minCols, maxCols }: Props) => {
  const defaultQuery: FeedAgentsCursorArguments = useMemo(
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

  const queryKey = useMemo(() => ['collections', query], [query])

  const onCreated = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKey as unknown as unknown[],
    })
  }

  return (
    <div className="space-y-4">
      <CreateAssistantSheet onCreated={onCreated} />
      <MasonryVirtualizerVertical
        key={JSON.stringify(queryKey)}
        apiEndpoint={'/api/feed/assistants'}
        queryKey={queryKey}
        query={query}
        minCols={minCols || 2}
        maxCols={maxCols || undefined}
        render={(item: RowItem) => (
          <AssistantCard assistant={item as Agent} queryKey={queryKey} />
        )}
      />
    </div>
  )
}

export default AssistantsFeed
