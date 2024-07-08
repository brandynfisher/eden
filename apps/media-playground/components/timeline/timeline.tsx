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

// const dummyTasks: TaskV2[] = [
//   {
//     _id: '6681eaea78f7a93ef54d96c3',
//     args: {
//       prompt: 'I am a STATIC DUMMY CREATION Butterfly',
//       negative_prompt: 'ugly, watermark, blurry, low-resolution, bad',
//       width: 896,
//       height: 512,
//       seed: 98540735953,
//       lora: null,
//       lora_strength: 0.5,
//     },
//     createdAt: '2024-06-30T23:31:54.120Z',
//     error: null,
//     result: [
//       'https://edenartlab-stage-data.s3.amazonaws.com/431e284fb9b7d06adf1ca1849e2f6ee17c9ea6ddfa69cdcfea3bdd7cffe5dae0.jpg',
//     ],
//     status: 'completed',
//     updatedAt: '2024-06-30T23:32:49.404Z',
//     user: '652bfd262ea937e07378268c',
//     workflow: 'txt2img',
//   },
// ]

type TaskData = {
  pageParams: number[]
  pages: TasksV2ListResponse[]
}

type Props = {
  workflow: GeneratorV2
}

const Timeline = ({ workflow }: Props) => {
  const queryClient = useQueryClient()
  const { lastMessageJson } = useWebSocketContext()

  const query: TasksV2ListArguments = useMemo(
    () => ({
      limit: 35,
      sort: ['createdAt;-1'],
      workflow: workflow.name,
    }),
    [workflow.name],
  )

  const queryKey = useMemo(
    () => [['tasks', workflow.name], query],
    [workflow.name, query],
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
      console.log('received task-update', taskUpdate)

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
    <div className="2xl:col-span-2">
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
