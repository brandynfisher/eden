import TimelineItemFooter from '@/components/Creation/CreationInterface/Timeline/TimelineItemFooter'
import TimelineItemHeaderInfo from '@/components/Creation/CreationInterface/Timeline/TimelineItemHeaderInfo'
import TimelineItemMedia from '@/components/Creation/CreationInterface/Timeline/TimelineItemMedia'
import TimelineItemMediaPlaceholder from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import TimelineItemPrompt from '@/components/Creation/CreationInterface/Timeline/TimelineItemPrompt'
import { Task } from '@edenlabs/eden-sdk'
import React, { useCallback, useEffect, useState } from 'react'

const noProgressGeneratorNames = [
  'create',
  'remix',
  'blend',
  'controlnet',
  'upscale',
]

const TimelineItem = ({
  task,
  listIndex,
}: {
  task: Task
  listIndex?: number
}) => {
  const creationUri = task && task.creation ? task.creation.uri : false

  const [fakeProgress, setFakeProgress] = useState(0)
  const increaseFakeProgress = useCallback(
    (increment: number, timerId: ReturnType<typeof setInterval>) => {
      setFakeProgress(prevState => {
        if (prevState + increment >= 100) {
          clearInterval(timerId)
          return 100
        }

        return prevState + increment
      })
    },
    [],
  )

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>

    if (
      task?.status === 'running' &&
      // task?.status === 'pending' &&
      noProgressGeneratorNames.includes(task?.generator.generatorName)
    ) {
      const increment = task?.config['n_samples']
        ? 4 / task?.config['n_samples']
        : 4
      timerId = setInterval(
        () => increaseFakeProgress(increment, timerId),
        1000,
      )
    }

    return () => {
      clearInterval(timerId)
    }
  }, [task.config, task?.status, task?.generator.generatorName])

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap mb-1 md:mb-2">
        <TimelineItemHeaderInfo task={task} />
        <div className="ml-auto"></div>
      </div>
      <TimelineItemPrompt text={task?.config.text_input} />

      {task.status === 'completed' ? (
        <TimelineItemMedia task={task} listIndex={listIndex} />
      ) : (
        <>
          {task.status === 'running' || task.status === 'pending' ? (
            <TimelineItemMediaPlaceholder
              task={task}
              progress={
                noProgressGeneratorNames.includes(task?.generator.generatorName)
                  ? fakeProgress
                  : task.progress || 0
              }
            />
          ) : null}
          {task.status === 'failed' ? (
            <div className="flex min-w-0 truncate mt-1">
              <div className="text-xs italic text-red-700 truncate">
                {task.error ? task.error : 'Unknown error'}
              </div>
            </div>
          ) : null}
        </>
      )}

      {task && !creationUri ? (
        <TimelineItemFooter
          task={task}
          progress={
            noProgressGeneratorNames.includes(task?.generator.generatorName)
              ? fakeProgress
              : task.progress || 0
          }
        />
      ) : null}
    </div>
  )
}

export default TimelineItem
