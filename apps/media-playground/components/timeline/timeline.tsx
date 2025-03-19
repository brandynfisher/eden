'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { Skeleton } from '@/components/ui/skeleton'
// import { Switch } from '@/components/ui/switch'
import {
  IPage,
  PageData,
  addDocIfNotExistInPage,
  updateDocInPage,
} from '@/lib/query/cache-updates'
import { useTaskStatus } from '@/providers/task-status-provider'
import { TaskV2, TasksV2ListArguments, ToolV2 } from '@edenlabs/eden-sdk'
import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useMemo } from 'react'

export const ListSkeleton = () => {
  return (
    <>
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-80 w-full" />
    </>
  )
}

type Props = {
  tool: ToolV2
}

const Timeline = ({ tool }: Props) => {
  // const [showAllToolResults, setShowAllToolResults] = useState(true)
  const queryClient = useQueryClient()
  const { subscribeToTaskUpdates } = useTaskStatus()

  // Define the query arguments based on the component's state and props
  const query: TasksV2ListArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      tool: tool.output_type === 'lora' ? tool.key : undefined,
    }),
    [tool.output_type, tool.key],
  )

  // Define the query key to match what TaskStatusProvider uses
  const queryKey: QueryKey = useMemo(
    () => [
      ['tasks', tool.output_type === 'lora' ? tool.key : undefined].filter(
        Boolean,
      ),
      query,
    ],
    [tool.output_type, tool.key, query],
  )

  // Subscribe to task updates via TaskStatusProvider
  useEffect(() => {
    const callback = (taskUpdate: TaskV2) => {
      if (taskUpdate.tool !== tool.key) return

      // Update the query cache for the infinite query in the timeline
      // queryClient.setQueryData<PageData<IPage<TaskV2>>>(queryKey, oldData => {
      //   if (!oldData) return oldData
      //
      //   // Update the document in the pages if it already exists, otherwise add it
      //   let updatedPages = updateDocInPage(taskUpdate, oldData.pages)
      //   updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)
      //
      //   return {
      //     ...oldData,
      //     pages: updatedPages,
      //   }
      // })

      queryClient.setQueryData<PageData<IPage<TaskV2>>>(queryKey, old => {
        // If 'old' is undefined or doesn't have any pages, throw an error or handle this case accordingly.
        if (!old || !old.pages.length) {
          // Either return the original data, throwing error or handling situation is up to your context.
          console.error('No pages to update!')
          return old
        }

        let updatedPages: IPage<TaskV2>[] = [...old.pages]

        let pageIndex = updatedPages.findIndex(page =>
          page?.docs?.some(doc => doc._id === taskUpdate._id),
        )

        if (pageIndex === -1) {
          updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)
        } else {
          updatedPages = updateDocInPage(taskUpdate, updatedPages)
        }

        return { ...old, pages: updatedPages }
      })
    }

    subscribeToTaskUpdates(callback)
    // // Subscribe to task updates and return an unsubscribe function
    // const unsubscribe = subscribeToTaskUpdates(callback)
    //
    // return () => {
    //   unsubscribe()
    // }
  }, [subscribeToTaskUpdates, queryClient, queryKey, tool.key])

  return (
    <div className="mb-8">
      {/* {tool.output_type !== 'lora' ? (
        <div className="flex ml-auto max-w-fit justify-between rounded-lg p-2 mb-2 ">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs" htmlFor={'show-all-tool-results'}>
              Show all tool results
            </label>
            <Switch
              id="show-all-tool-results"
              defaultChecked={showAllToolResults}
              onCheckedChange={setShowAllToolResults}
            />
          </div>
        </div>
      ) : null} */}

      <div data-test-id="timeline">
        <Suspense>
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
