import ResultPreviewDisplay from '@/components/Creation/CreationInterface/ResultPreviewDisplay'
import { truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import Button from '@mui/material/Button'
import { App, Card, Divider, Progress } from 'antd'
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
  const { pendingTasks, completedTasks } = useContext(
    CreationNotificationContext,
  )

  const taskList = [...(pendingTasks || []), ...(completedTasks || [])]

  return (
    <div>
      {/*<Button>*/}
      {/*  <span className="absolute">{pendingTasks?.length}</span>*/}
      {/*  <span className="loading loading-ring loading-md"></span>*/}
      {/*</Button>*/}
      <div className="flex flex-col gap-4">
        {taskList.map(task => (
          <ResultPreview key={task._id} task={task} innerRef={innerRef} />
        ))}
      </div>
    </div>
  )
}

const ResultPreview = ({
  task,
  innerRef,
}: {
  task: Task
  innerRef: RefObject<HTMLDivElement>
}) => {
  // const activeTask = pendingTasks && pendingTasks[pendingTasks.length - 1]
  // const completedTask =
  //   completedTasks && completedTasks[completedTasks.length - 1]
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
      task?.status === 'pending' &&
      noProgressGeneratorNames.includes(task?.generator.generatorName)
    ) {
      timerId = setInterval(() => increaseFakeProgress(3, timerId), 1000)
    }

    return () => {
      clearInterval(timerId)
    }
  }, [task])

  return (
    <div
      ref={innerRef}
      className="result-preview relative w-full flex flex-col rounded-lg border border-0 border-solid"
    >
      <Card
        className={`lg:sticky lg:top-4 w-full min-h-[512px] h-fit flex justify-center items-center`}
      >
        <div className="flex justify-center items-center h-full">
          {/*{*/}
          {/*task.status !== 'running' &&*/}
          {/*task.status !== 'completed' ? (*/}
          {/*  <div className={'text-gray-500'}>Result will appear here</div>*/}
          {/*) : (*/}
          <>
            {!creationUri ? (
              <div className="w-full">
                <div className="text-center">
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
                  <Button>
                    {/*<span className="absolute">{pendingTasks?.length}</span>*/}
                    <span className="loading loading-ring loading-xl"></span>
                  </Button>
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
                    <div className="mt-2">...</div>
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
                      <div className="text-xs text-gray-800 dark:text-gray-400">
                        Cost: <strong>{task?.cost}</strong> Manna
                      </div>
                    </div>
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
                )}
                <Divider />
                <div className="text-center text-gray-400 mt-4 font-bold">
                  You can continue using the app, run multiple tasks or close
                  this tab. No need to wait.
                </div>
              </div>
            ) : (
              <ResultPreviewDisplay creationId={creationId} />
            )}
          </>
          {/*)}*/}
        </div>
      </Card>
    </div>
  )
}

export default ResultPreviewList
