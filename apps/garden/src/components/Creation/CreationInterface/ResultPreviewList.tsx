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
  const { pendingTasks, completedTasks } = useContext(
    CreationNotificationContext,
  )
  const [taskList, setTaskList] = useState<
    null | { dot: React.ReactNode; children: React.ReactNode }[]
  >(null)

  useEffect(() => {
    setTaskList(
      [...(completedTasks || []), ...(pendingTasks || [])].map(task => {
        return {
          dot: getTimelineDot(task.status),
          children: <ResultPreview task={task} />,
        }
      }),
    )
  }, [completedTasks, pendingTasks])

  return (
    <div>
      <div className="flex flex-col" ref={innerRef}>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4 gap-2">
          <div>
            You can continue using the app, run multiple tasks or close this
            tab.
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative flex items-center justify-center">
              <span className="absolute">{pendingTasks?.length}</span>
              <span className="loading loading-ring loading-lg"></span>
            </div>
            Tasks queued
          </div>
        </div>
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
    setFakeProgress(0)

    if (
      task?.status === 'running' &&
      noProgressGeneratorNames.includes(task?.generator.generatorName)
    ) {
      timerId = setInterval(() => increaseFakeProgress(3, timerId), 1000)
    }

    return () => {
      clearInterval(timerId)
    }
  }, [task?.status, task?.generator.generatorName])

  return (
    <div className="result-preview relative w-full flex flex-col rounded-lg border border-0 border-solid">
      <Card className={`w-full h-fit flex justify-center items-center`}>
        <div className="flex justify-center items-center h-full">
          <>
            {!creationUri ? (
              <div className="w-full">
                <div>
                  <div className="mb-4">
                    <div title={task?.config.text_input || ''}>
                      <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                        <strong className="dark:text-gray-200 mr-1">
                          /{task?.generator.generatorName}
                        </strong>
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
                      <div className="capitalize mb-2">
                        <strong>{task.status}</strong>
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
                        Started {timeAgo(task.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div
                        className="flex items-center gap-2 cursor-copy mb-2"
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
                      <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
                        Cost: <strong>{task?.cost}</strong> Manna
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ResultPreviewDisplay creationId={creationId} />
            )}
          </>
        </div>
      </Card>
    </div>
  )
}

export default ResultPreviewList
