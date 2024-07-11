'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { useWebSocketContext } from '@/provider/websocket-provider'
import {
  GeneratorV2,
  TaskV2,
  TasksV2ListArguments,
  TasksV2ListResponse,
} from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

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

  const query: TasksV2ListArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      workflow: generator.key,
    }),
    [generator.key],
  )

  const queryKey = useMemo(
    () => [['tasks', generator.key], query],
    [generator.key, query],
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

      if (taskUpdate.workflow !== generator.key) {
        console.log(
          `discarding task-update for ${taskUpdate.workflow}`,
          taskUpdate,
        )
        return
      }

      console.log(`received task-update for ${taskUpdate.workflow}`, taskUpdate)

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
    <div data-test-id="timeline" className="2xl:col-span-2">
      <ListVirtualizerVertical
        apiEndpoint={'/api/tasks/list'}
        query={query}
        queryKey={queryKey}
        render={TimelineItem}
      />
    </div>
  )
}

export default Timeline
