'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
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
import { useEffect, useMemo, useState } from 'react'

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
      workflow: filterTasksByCurrentWorkflow ? generator.key : undefined,
    }),
    [filterTasksByCurrentWorkflow, generator.key],
  )

  const queryKey = useMemo(
    () => [
      ['tasks', filterTasksByCurrentWorkflow ? generator.key : undefined],
      query,
    ],
    [filterTasksByCurrentWorkflow, generator.key, query],
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
            let updatedPages: IPage<RowItem>[] = old ? [...old.pages] : []

            if (updatedPages.length > 0) {
              updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)
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
    <div className="mb-8 2xl:col-span-2 md:pt-4">
      <div className="flex flex-row items-center justify-between rounded-lg border p-4 mt-2 mb-4">
        <div className="space-y-0.5">
          <label className="text-base">Hide other tool results</label>
        </div>
        <Switch
          checked={filterTasksByCurrentWorkflow}
          onCheckedChange={setFilterTasksByCurrentWorkflow}
        />
      </div>

      <div data-test-id="timeline">
        <ListVirtualizerVertical
          apiEndpoint={'/api/tasks/list'}
          query={query}
          queryKey={queryKey}
          render={item => (
            <TimelineItem item={item.item} outputType={generator.outputType} />
          )}
        />
      </div>
    </div>
  )
}

export default Timeline
