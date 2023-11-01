import ResultPreviewDisplay from '@/components/Creation/CreationInterface/ResultPreviewDisplay'
import { truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Card, Empty, Progress } from 'antd'
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

const ResultPreviewList = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { tasks } = useContext(CreationNotificationContext)

  return (
    <div>
      <div className="flex flex-col" ref={innerRef}>
        {tasks && tasks.length ? (
          tasks.map((task, index) => (
            <ResultPreview key={task._id} task={task} index={index} />
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
    </div>
  )
}

const ResultPreview = ({ task, index }: { task: Task; index: number }) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async (taskId: string) => {
    await copy(taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  const creationUri = task && task.creation ? task.creation.uri : false
  const creationId = task && task.creation ? task.creation._id : false

  const [fakeProgress, setFakeProgress] = useState(0)
  const increaseFakeProgress = useCallback(
    (increment: number, timerId: ReturnType<typeof setInterval>) => {
      setFakeProgress(prevState => {
        if (prevState + increment >= 99) {
          clearInterval(timerId)
          return 95
        }

        return prevState + increment
      })
    },
    [],
  )

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>
    setFakeProgress(0)

    if (
      task?.status === 'running' &&
      noProgressGeneratorNames.includes(task?.generator.generatorName)
    ) {
      const increment = task?.config['n_samples']
        ? 5 / task?.config['n_samples']
        : 5
      timerId = setInterval(
        () => increaseFakeProgress(increment, timerId),
        1000,
      )
    }

    return () => {
      clearInterval(timerId)
    }
  }, [task?.status, task?.generator.generatorName])

  return (
    <div className="result-preview mb-4 relative w-full flex flex-col rounded-lg border-0">
      <Card
        className={`w-full h-fit flex justify-center items-center ${
          creationUri ? 'result-preview-success' : ''
        }`}
      >
        <>
          {!creationUri ? (
            <div className="w-full">
              <div>
                <div>
                  <div className="flex items-center justify-between flex-wrap">
                    <div className="flex items-center mb-2">
                      <strong className=" text-sm dark:text-gray-200">
                        /{task?.generator.generatorName}
                      </strong>
                      <div
                        className="text-gray-700 dark:text-gray-400 text-xs"
                        title={timeAgo(task.createdAt)}
                      >
                        <span className="text-xs text-gray-800 dark:text-gray-400 mx-1">
                          •
                        </span>
                        {timeAgo(task.createdAt)}
                      </div>
                      <span className="text-xs text-gray-800 dark:text-gray-400 mx-1">
                        •
                      </span>
                      <div className="text-xs text-gray-800 dark:text-gray-400">
                        {task?.cost} Manna
                      </div>
                    </div>
                  </div>
                  <div title={task?.config.text_input || ''} className="mb-1">
                    <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                      {task?.config.text_input || ''}
                    </span>
                  </div>
                </div>
                {task?.status === 'running' ? (
                  <Progress
                    percent={
                      fakeProgress > 0
                        ? fakeProgress
                        : task?.progress
                        ? Math.round(task.progress * 100)
                        : 0
                    }
                    status="active"
                    className="mt-2 flex items-center"
                  />
                ) : (
                  <div className="mt-2 opacity-0">...</div>
                )}
              </div>
              {task && (
                <div className="flex justify-between text-xs">
                  <div>
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
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between flex-wrap mb-2">
                <div className="flex items-center">
                  <strong className=" text-sm dark:text-gray-200">
                    /{task?.generator.generatorName}
                  </strong>
                  <span className=" text-gray-700 dark:text-gray-400 text-xs mx-1">
                    •
                  </span>
                  <div
                    className="text-gray-700 dark:text-gray-400 text-xs"
                    title={timeAgo(task.createdAt)}
                  >
                    {timeAgo(task.createdAt)}
                  </div>
                  <span className="text-gray-700 dark:text-gray-400 text-xs mx-1">
                    •
                  </span>
                  <div className="text-xs text-gray-800 dark:text-gray-400">
                    {task.cost} Manna
                  </div>
                </div>
              </div>
              <div title={task?.config.text_input || ''} className="mb-2">
                <span className="relative first-letter:uppercase text-xs select-text cursor-text text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                  {task?.config.text_input || ''}
                </span>
              </div>

              {task.samples && task.samples.length ? (
                <div
                  className={`grid grid-cols-2 gap-2 2xl:grid-cols-${task.samples.length}`}
                >
                  {task.samples.map(id => (
                    <ResultPreviewDisplay
                      key={id}
                      creationId={id}
                      priority={index < 2}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 2xl:grid-cols-2">
                  <ResultPreviewDisplay
                    creationId={creationId}
                    priority={index < 2}
                  />
                </div>
              )}
            </div>
          )}
        </>
      </Card>
    </div>
  )
}

export default ResultPreviewList
