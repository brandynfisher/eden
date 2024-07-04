'use client'

import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Skeleton } from '@/components/ui/skeleton'
import { useWebSocketContext } from '@/provider/websocket-provider'
import { TaskV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
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

const Timeline = () => {
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
    <div>
      {!tasks || !tasks.length ? (
        <div className="bg-primary/5 w-full h-full flex justify-center rounded-lg">
          <div className="py-3 px-4 self-center">No recent tasks found.</div>
        </div>
      ) : null}
      {tasks.map(task => (
        <div key={task._id} className="relative">
          <TaskStatusBadge status={task.status} hideText={true} />
          {task.status === 'failed' ? (
            <div>
              <div className="text-destructive">Task failed</div>
              <div>{task.error}</div>
            </div>
          ) : null}

          {task.status === 'pending' || task.status === 'running' ? (
            <div className="w-full">
              <AspectRatio
                ratio={(task.args.width || 1024) / (task.args.height || 1024)}
              >
                <Skeleton className="w-full h-full" />
              </AspectRatio>
            </div>
          ) : null}

          {task.status === 'completed'
            ? task.result.map(result => (
                <div className="relative" key={result}>
                  <Image
                    src={result}
                    alt={result}
                    // fill={true}
                    objectFit={'cover'}
                    width={task.args.width}
                    height={task.args.height}
                    className="object-cover w-full rounded-lg"
                  />
                </div>
              ))
            : null}

          <TaskParameterList task={task} />

          {/*<Accordion type='single' collapsible>*/}
          {/*  <AccordionItem value='item-1'>*/}
          {/*    <AccordionTrigger>DEBUG: Task Config</AccordionTrigger>*/}
          {/*    <AccordionContent>*/}
          {/*      <div className='text-xs'>*/}
          {/*        {JSON.stringify(task.args, null, 2)}*/}
          {/*      </div>*/}
          {/*    </AccordionContent>*/}
          {/*  </AccordionItem>*/}
          {/*</Accordion>*/}
        </div>
      ))}
    </div>
  )
}

export default Timeline
