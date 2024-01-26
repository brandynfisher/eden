import TimelineItemFooter from '@/components/Creation/CreationInterface/Timeline/TimelineItemFooter'
import TimelineItemHeaderInfo from '@/components/Creation/CreationInterface/Timeline/TimelineItemHeaderInfo'
import TimelineItemMedia from '@/components/Creation/CreationInterface/Timeline/TimelineItemMedia'
import TimelineItemMediaPlaceholder from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import TimelineItemPrompt from '@/components/Creation/CreationInterface/Timeline/TimelineItemPrompt'
import { Generator, Task } from '@edenlabs/eden-sdk'
import React, { useCallback, useEffect, useState } from 'react'

const noProgressImageGeneratorNames = [
  'create',
  'remix',
  'blend',
  'controlnet',
  'upscale',
]

const noProgressVideoGeneratorNames = ['img2vid', 'vid2vid', 'text2vid']

const getFakeProgressIncrement = (
  generatorName: Generator['generatorName'],
  taskConfig: Task['config'],
) => {
  if (
    noProgressImageGeneratorNames.includes(generatorName) &&
    taskConfig['n_samples']
  ) {
    return 4 / taskConfig['n_samples']
  }

  if (
    noProgressVideoGeneratorNames.includes(generatorName) &&
    taskConfig['n_frames']
  ) {
    return 20 / taskConfig['n_frames']
  }

  return 4
}

const TimelineItem = ({
  task,
  listIndex,
}: {
  task: Task
  listIndex?: number
}) => {
  // const creationUri = task && task.creation ? task.creation.uri : false

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
      (noProgressImageGeneratorNames.includes(task?.generator.generatorName) ||
        noProgressVideoGeneratorNames.includes(task?.generator.generatorName))
    ) {
      timerId = setInterval(
        () =>
          increaseFakeProgress(
            getFakeProgressIncrement(task.generator.generatorName, task.config),
            timerId,
          ),
        1000,
      )
    }

    return () => {
      if (timerId) {
        clearInterval(timerId)
      }
    }
  }, [
    increaseFakeProgress,
    task.config,
    task?.status,
    task?.generator.generatorName,
  ])

  return (
    <div className="relative">
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
                noProgressImageGeneratorNames.includes(
                  task?.generator.generatorName,
                ) ||
                noProgressVideoGeneratorNames.includes(
                  task?.generator.generatorName,
                )
                  ? Math.floor(fakeProgress)
                  : task.progress
                  ? Math.floor(task.progress * 100)
                  : 0
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

      <div>
        {/*{task && !creationUri ? (*/}
        <TimelineItemFooter
          task={task}
          progress={
            noProgressImageGeneratorNames.includes(
              task?.generator.generatorName,
            ) ||
            noProgressVideoGeneratorNames.includes(
              task?.generator.generatorName,
            )
              ? Math.floor(fakeProgress)
              : task.progress
              ? Math.floor(task.progress * 100)
              : 0
          }
        />
        {/*) : null}*/}
      </div>
    </div>
  )
}

export default TimelineItem
