'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { Switch } from '@/components/ui/switch'
import {
  IPage,
  PageData,
  RowItem,
  addDocIfNotExistInPage,
  updateDocInPage,
} from '@/lib/query'
import { useWebSocketContext } from '@/provider/websocket-provider'
import { GeneratorV2, TaskV2, TasksV2ListArguments } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect, useMemo, useState } from 'react'

type Props = {
  generator: GeneratorV2
}

const Timeline = ({ generator }: Props) => {
  const queryClient = useQueryClient()
  const { lastMessageJson } = useWebSocketContext()
  const [filterTasksByCurrentWorkflow, setFilterTasksByCurrentWorkflow] =
    useState(false)

  const query: TasksV2ListArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      workflow:
        generator.outputType === 'lora'
          ? generator.key
          : filterTasksByCurrentWorkflow
          ? generator.key
          : undefined,
    }),
    [filterTasksByCurrentWorkflow, generator.outputType, generator.key],
  )

  const queryKey = useMemo(
    () => [
      [
        'tasks',
        generator.outputType === 'lora'
          ? generator.key
          : filterTasksByCurrentWorkflow
          ? generator.key
          : undefined,
      ],
      query,
    ],
    [filterTasksByCurrentWorkflow, generator.outputType, generator.key, query],
  )

  useEffect(() => {
    if (!lastMessageJson) {
      return
    }

    if (
      lastMessageJson.event === 'task-update' &&
      lastMessageJson.data &&
      lastMessageJson.data.task
    ) {
      const taskUpdate = lastMessageJson.data.task as TaskV2

      if (
        filterTasksByCurrentWorkflow &&
        taskUpdate.workflow !== generator.key
      ) {
        console.log(
          `discarding task-update for other workflow: ${taskUpdate.workflow}`,
          taskUpdate,
        )
        return
      }

      console.log(
        `received task-update for workflow: ${taskUpdate.workflow}`,
        taskUpdate,
      )

      try {
        queryClient.setQueryData(
          queryKey,
          (old: PageData<IPage<RowItem>> | undefined) => {
            if (!old || !old.pages.length) {
              console.error('No pages to update!')
              return old
            }

            let updatedPages: IPage<RowItem>[] = [...old.pages]

            let pageIndex = updatedPages.findIndex(page =>
              page?.docs?.some(doc => doc._id === taskUpdate._id),
            )

            if (pageIndex === -1) {
              updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)
            } else {
              updatedPages = updateDocInPage(taskUpdate, updatedPages)
            }

            return { ...old, pages: updatedPages }
          },
        )
      } catch (e) {
        console.log(e)
      }
    }
  }, [
    filterTasksByCurrentWorkflow,
    generator.key,
    lastMessageJson,
    queryClient,
    queryKey,
  ])

  return (
    <div className="mb-8 lg:col-span-2 md:pt-4">
      {generator.outputType !== 'lora' ? (
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 my-2">
          <div className="space-y-0.5">
            <label className="text-base">Hide other tool results</label>
          </div>
          <Switch
            checked={filterTasksByCurrentWorkflow}
            onCheckedChange={setFilterTasksByCurrentWorkflow}
          />
        </div>
      ) : null}

      <div data-test-id="timeline">
        <Suspense fallback={<MasonrySkeleton />}>
          <ListVirtualizerVertical
            apiEndpoint={'/api/tasks/list'}
            query={query}
            queryKey={queryKey}
            render={item => <TimelineItem item={item.item} />}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default Timeline
