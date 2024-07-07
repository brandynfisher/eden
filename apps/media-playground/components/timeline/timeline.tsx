'use client'

import ListVirtualizerVertical from '@/components/masonry/list-virtualizer-vertical'
import TimelineItem from '@/components/timeline/timeline-item'
import { useWebSocketContext } from '@/provider/websocket-provider'
import { GeneratorV2, TaskV2 } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

const dummyTasks: TaskV2[] = [
  {
    _id: '6681eaea78f7a93ef54d96c3',
    args: {
      prompt: 'I am a STATIC DUMMY CREATION Butterfly',
      negative_prompt: 'ugly, watermark, blurry, low-resolution, bad',
      width: 896,
      height: 512,
      seed: 98540735953,
      lora: null,
      lora_strength: 0.5,
    },
    createdAt: '2024-06-30T23:31:54.120Z',
    error: null,
    result: [
      'https://edenartlab-stage-data.s3.amazonaws.com/431e284fb9b7d06adf1ca1849e2f6ee17c9ea6ddfa69cdcfea3bdd7cffe5dae0.jpg',
    ],
    status: 'completed',
    updatedAt: '2024-06-30T23:32:49.404Z',
    user: '652bfd262ea937e07378268c',
    workflow: 'txt2img',
  },
]

type Props = {
  workflow: GeneratorV2
}

const Timeline = ({ workflow }: Props) => {
  const { lastMessageJson } = useWebSocketContext()
  // @todo: handle tasks via global state (zustand?) OR re-implement messageHistory in Websocket Context?
  const [tasks, setTasks] = useState<TaskV2[]>(dummyTasks)

  useEffect(() => {
    if (!lastMessageJson) {
      return
    }

    if (
      lastMessageJson.event &&
      lastMessageJson.event === 'task-update' &&
      lastMessageJson.data &&
      lastMessageJson.data.task
    ) {
      const taskUpdate = lastMessageJson.data.task as TaskV2
      console.log('received task-update', taskUpdate)
      setTasks(prev => {
        // add task to array if no object with a value of task._id exists in prev yet, otherwise update/replace the existing entry
        const updatedTasks = prev.map(task => {
          if (task._id === taskUpdate._id) {
            return taskUpdate
          }
          return task
        })
        if (!prev.some(task => task._id === taskUpdate._id)) {
          updatedTasks.unshift(taskUpdate)
        }
        return updatedTasks
      })
    }
  }, [lastMessageJson])

  return (
    <div className="2xl:col-span-2">
      {!tasks || !tasks.length ? (
        <div className="bg-primary/5 w-full h-full flex justify-center rounded-lg">
          <div className="py-3 px-4 self-center">No recent tasks found.</div>
        </div>
      ) : null}
      <ListVirtualizerVertical
        apiEndpoint={'/api/tasks/list'}
        filter={{ workflow: workflow.name }}
        baseQueryKey={['tasks', workflow.name]}
        render={TimelineItem}
      />
    </div>
  )
}

export default Timeline
