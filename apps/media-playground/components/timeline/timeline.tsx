'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { Switch } from '@/components/ui/switch'
import { useWebSocketContext } from '@/provider/websocket-provider'
import {
  GeneratorV2,
  TaskV2,
  TasksV2ListArguments,
  TasksV2ListResponse,
} from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

type TaskData = {
  pageParams: number[]
  pages: TasksV2ListResponse[]
}

type Props = {
  generator: GeneratorV2
}

const Timeline = ({ generator }: Props) => {
  const queryClient = useQueryClient()
  const { lastMessageJson } = useWebSocketContext()
  const [filterTasksByCurrentWorkflow, setFilterTasksByCurrentWorkflow] =
    useState(true)

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

      queryClient.setQueryData(queryKey, (old: TaskData | undefined) => {
        // Copy the old pages array
        let updatedPages: TasksV2ListResponse[] = old ? [...old.pages] : []
        if (updatedPages.length > 0) {
          // Find the page that contains the task
          const pageIndex = updatedPages.findIndex(page =>
            page?.docs?.some(task => task._id === taskUpdate._id),
          )
          if (pageIndex !== -1) {
            // The task is in one of the pages, update the task
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              docs: updatedPages[pageIndex]?.docs?.map(task =>
                task._id === taskUpdate._id ? taskUpdate : task,
              ),
            }
          } else {
            // The task is not in any pages, add to the beginning of docs in the first page
            updatedPages[0] = {
              ...updatedPages[0],
              docs: [taskUpdate, ...(updatedPages[0].docs || [])],
            }
          }
        }
        return { ...old, pages: updatedPages }
      })
    }
  }, [lastMessageJson, queryClient, queryKey])

  return (
    <div className="mb-8 2xl:col-span-2 md:pt-4">
      <div className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
        <div className="space-y-0.5">
          <label className="text-base">Only show current workflow</label>
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
