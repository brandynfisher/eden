import ResultPreviewDisplay from '@/components/Creation/CreationInterface/ResultPreviewDisplay'
import { truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import TaskAlt from '@mui/icons-material/TaskAlt'
import WarningAmber from '@mui/icons-material/WarningAmber'
import { App, Card, Progress, Timeline } from 'antd'
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

const getTimelineDot = (status: Task['status']) => {
  switch (status) {
    case 'starting':
    case 'pending':
      return (
        <div className="flex bg-white text-gray-500 dark:bg-gray-950 rounded-full p-0.5">
          <HourglassEmpty fontSize="small" className="animate-pulse" />
        </div>
      )
    case 'running':
      return (
        <div className="flex bg-white dark:bg-gray-950 rounded-full p-0.5">
          <span className="loading loading-ring loading-md"></span>
        </div>
      )
    case 'completed':
      return (
        <div className="flex text-green-500 items-center bg-white dark:bg-gray-950 rounded-full p-0.5">
          <TaskAlt fontSize="small" />
        </div>
      )
    case 'failed':
      return (
        <div className="flex text-red-500 items-center bg-white dark:bg-gray-950 rounded-full p-0.5">
          <WarningAmber fontSize="small" />
        </div>
      )
    default:
      return null
  }
}

const ResultPreviewList = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { tasks } = useContext(CreationNotificationContext)
  const [taskList, setTaskList] = useState<
    null | { dot: React.ReactNode; children: React.ReactNode }[]
  >(null)

  useEffect(() => {
    // console.log(tasks)
    if (tasks && tasks.length) {
      setTaskList(
        tasks.map(task => {
          return {
            dot: getTimelineDot(task.status),
            children: <ResultPreview task={task} />,
          }
        }),
      )
    }
  }, [tasks])

  return (
    <div>
      <div className="flex flex-col" ref={innerRef}>
        {taskList && taskList.length ? <Timeline items={taskList} /> : null}
      </div>
    </div>
  )
}

const ResultPreview = ({ task }: { task: Task }) => {
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
      timerId = setInterval(() => increaseFakeProgress(5, timerId), 1000)
    }

    return () => {
      clearInterval(timerId)
    }
  }, [task?.status, task?.generator.generatorName])

  return (
    <div className="result-preview relative w-full flex flex-col rounded-lg border border-0 border-solid">
      <Card className={`w-full h-fit flex justify-center items-center`}>
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
                        <span className="mx-1">•</span>
                        {timeAgo(task.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-800 dark:text-gray-400">
                      <strong>{task?.cost}</strong> Manna
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
                  <div
                    className="text-gray-700 dark:text-gray-400 text-xs"
                    title={timeAgo(task.createdAt)}
                  >
                    <span className="mx-1">•</span>
                    {timeAgo(task.createdAt)}
                  </div>
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-400">
                  <strong>{task.cost}</strong> Manna
                </div>
              </div>
              <div title={task?.config.text_input || ''} className="mb-2">
                <span className="relative first-letter:uppercase text-xs select-text cursor-text text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                  {task?.config.text_input || ''}
                </span>
              </div>

              {task.samples && task.samples.length > 1 ? (
                <div className="grid grid-cols-2 gap-2">
                  {task.samples.map(id => (
                    <ResultPreviewDisplay key={id} creationId={id} />
                  ))}
                </div>
              ) : (
                <ResultPreviewDisplay creationId={creationId} />
              )}
            </div>
          )}
        </>
      </Card>
    </div>
  )
}

export default ResultPreviewList
