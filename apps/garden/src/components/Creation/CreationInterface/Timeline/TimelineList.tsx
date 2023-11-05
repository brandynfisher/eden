import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import TimelineItemMediaPlaceholder, {
  ProgressCard,
} from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { CircularProgress } from '@mui/material'
import { Alert, App, Card, Empty } from 'antd'
import React, {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const noProgressGeneratorNames = [
  'create',
  'remix',
  'blend',
  'controlnet',
  'upscale',
]

const TimelineItemHeaderInfo = ({ task }: { task: Task }) => {
  return (
    <div className="flex items-center">
      <strong className=" text-sm dark:text-gray-200">
        /{task?.generator.generatorName}
      </strong>
      <span className=" text-gray-700 dark:text-gray-400 text-xs mx-1">•</span>
      <div
        className="text-gray-700 dark:text-gray-400 text-xs"
        title={timeAgo(task.createdAt)}
      >
        {timeAgo(task.createdAt)}
      </div>
      <span className="text-gray-700 dark:text-gray-400 text-xs mx-1">•</span>
      <div className="text-xs text-gray-800 dark:text-gray-400">
        {task.cost} Manna
      </div>
    </div>
  )
}

const TimelineItemPrompt = ({ text }: { text?: string }) => {
  return (
    <div title={text || ''} className="mb-2">
      <span className="relative first-letter:uppercase text-xs select-text cursor-text text-ellipsis dark:text-gray-400 break-words line-clamp-2">
        {text || ''}
      </span>
    </div>
  )
}

const TimelineItemSample = ({
  task,
  creationId,
  listIndex,
}: {
  task: Task
  creationId: string
  listIndex: number
}) => {
  const { creation, isLoading } = useCreation(creationId)
  const { showModal } = useModalContext()

  const handleCardClick = useCallback(() => {
    showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
      creation: creation ? creation : undefined,
      loadSimilar: false,
      usesUrl: true,
    })
  }, [creation])

  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        <ProgressCard task={task} />
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg text-2xl">
          <LoadingIndicator />
        </div>
      </div>
    )
  }

  if (!creation) {
    return <div>not found</div>
  }

  return (
    <CreationCard
      index={listIndex || 0}
      data={creation}
      onClick={handleCardClick}
    />
  )
}

const TimelineItemMedia = ({
  task,
  listIndex,
}: {
  task: Task
  listIndex?: number
}) => {
  return (
    <>
      {task.samples && task.samples.length ? (
        <div className={`grid grid-cols-2 gap-2`}>
          {task.samples.map(id => (
            <TimelineItemSample
              key={id}
              task={task}
              creationId={id}
              listIndex={listIndex || 0}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1">
          <TimelineItemSample
            task={task}
            creationId={task.creation._id}
            listIndex={listIndex || 0}
          />
        </div>
      )}
    </>
  )
}

const TimelineItemFooter = ({
  task,
  progress,
}: {
  task: Task
  progress: number
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async (taskId: string) => {
    await copy(taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs mt-2">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center">
          <CircularProgress
            size="20px"
            thickness={5}
            variant="determinate"
            value={100}
            className="absolute text-gray-300 dark:text-gray-800"
          />
          <CircularProgress
            size="20px"
            thickness={10}
            variant="determinate"
            value={progress}
            color="info"
          />
          {/*<div className="absolute text-xs text-gray-500">{Math.round(progress)}</div>*/}
        </div>
        <div className="capitalize text-gray-800 dark:text-gray-400">
          <strong>{task.status}</strong>
        </div>
      </div>
      <div>
        <div
          className="flex items-center gap-2 cursor-copy"
          onClick={() => handleCopyClick(task.taskId)}
        >
          <div
            className="italic text-gray-800 dark:text-gray-400"
            title={task.taskId}
          >
            {truncatedAddress(task.taskId)}
          </div>
          {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
        </div>
      </div>
    </div>
  )
}

const ResultPreviewDisplayWrap = ({
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
      <div className="flex items-center justify-between flex-wrap mb-2">
        <TimelineItemHeaderInfo task={task} />
        <div className="ml-auto"></div>
      </div>
      <TimelineItemPrompt text={task?.config.text_input} />

      {creationUri ? (
        <TimelineItemMedia task={task} listIndex={listIndex} />
      ) : (
        <>
          {task.status === 'running' ||
          task.status === 'pending' ||
          task.status === 'completed' ? (
            <TimelineItemMediaPlaceholder
              task={task}
              progress={
                noProgressGeneratorNames.includes(task?.generator.generatorName)
                  ? fakeProgress
                  : task.progress || 0
              }
            />
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

const TimelineListWrap = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { tasks } = useContext(CreationNotificationContext)

  return (
    <div className="flex flex-col pb-[104px] md:pb-0" ref={innerRef}>
      {tasks && tasks.length ? (
        tasks.map((task, index) => (
          <TimelineList key={task._id} task={task} index={index} />
        ))
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col items-center">
              <div className="mb-4">No recent tasks found.</div>
            </div>
          }
        />
      )}
    </div>
  )
}

const TimelineList = ({ task, index }: { task: Task; index: number }) => {
  return (
    <div className="result-preview mb-4 relative w-full flex flex-col rounded-lg border-0 md:items-center">
      {index === 0 &&
      (task.status === 'pending' || task.status === 'running') ? (
        <Alert
          className={`w-full h-fit flex justify-center items-center md:max-w-[640px] mb-4 px-4 py-2 text-gray-500`}
          description="Tasks are being processed on our servers. You can keep using the app or close it."
        />
      ) : null}
      <Card
        className={`w-full h-fit flex justify-center items-center md:max-w-[640px]`}
      >
        <ResultPreviewDisplayWrap task={task} listIndex={index} />
      </Card>
    </div>
  )
}

export default TimelineListWrap
