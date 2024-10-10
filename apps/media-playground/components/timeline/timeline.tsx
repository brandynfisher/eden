// timeline.tsx
'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  IPage,
  PageData,
  addDocIfNotExistInPage,
  updateDocInPage,
} from '@/lib/query/cache-updates'
import { useTaskStatus } from '@/providers/task-status-provider'
import { GeneratorV2, TaskV2, TasksV2ListArguments } from '@edenlabs/eden-sdk'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useMemo, useState } from 'react'

// timeline.tsx

// timeline.tsx

type Props = {
  generator: GeneratorV2
}

const Timeline = ({ generator }: Props) => {
  const [showAllToolResults, setShowAllToolResults] = useState(true)
  const queryClient = useQueryClient()
  const { subscribeToTaskUpdates } = useTaskStatus()

  // Define the query arguments based on the component's state and props
  const query: TasksV2ListArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      workflow:
        generator.outputType === 'lora'
          ? generator.key
          : !showAllToolResults
          ? generator.key
          : undefined,
    }),
    [showAllToolResults, generator.outputType, generator.key],
  )

  // Define the query key to match what TaskStatusProvider uses
  const queryKey: QueryKey = useMemo(
    () => [
      [
        'tasks',
        generator.outputType === 'lora'
          ? generator.key
          : !showAllToolResults
          ? generator.key
          : undefined,
      ].filter(Boolean),
      query,
    ],
    [showAllToolResults, generator.outputType, generator.key, query],
  )

  // Subscribe to task updates via TaskStatusProvider
  useEffect(() => {
    const callback = (taskUpdate: TaskV2) => {
      // Update the query cache for the infinite query in the timeline
      queryClient.setQueryData<PageData<IPage<TaskV2>>>(queryKey, oldData => {
        if (!oldData) return oldData

        // Update the document in the pages if it already exists, otherwise add it
        let updatedPages = updateDocInPage(taskUpdate, oldData.pages)
        updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)

        return {
          ...oldData,
          pages: updatedPages,
        }
      })
    }

    subscribeToTaskUpdates(callback)
    // // Subscribe to task updates and return an unsubscribe function
    // const unsubscribe = subscribeToTaskUpdates(callback)
    //
    // return () => {
    //   unsubscribe()
    // }
  }, [subscribeToTaskUpdates, queryClient, queryKey])

  return (
    <div className="mb-8 lg:col-span-2 md:pt-4">
      <DropdownMenuSeparator className="mt-2 mb-4 md:hidden" />

      {generator.outputType !== 'lora' ? (
        <div className="flex ml-auto max-w-fit justify-between rounded-lg p-4 mb-2 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm">Show all tool results</label>
            <Switch
              defaultChecked={showAllToolResults}
              onCheckedChange={setShowAllToolResults}
            />
          </div>
        </div>
      ) : null}

      <div data-test-id="timeline">
        <Suspense fallback={<MasonrySkeleton />}>
          <ListVirtualizerVertical
            apiEndpoint={'/api/tasks/list'}
            query={query}
            queryKey={queryKey}
            render={item => (
              <TimelineItem item={item.item} queryKey={queryKey} />
            )}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default Timeline
