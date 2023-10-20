import ResultPreviewDisplay from '@/components/Creation/CreationInterface/ResultPreviewDisplay'
import { truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
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

const ResultPreview = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async (taskId: string) => {
    await copy(taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  const { pendingTasks, completedTasks } = useContext(
    CreationNotificationContext,
  )

  const activeTask = pendingTasks && pendingTasks[pendingTasks.length - 1]
  const completedTask =
    completedTasks && completedTasks[completedTasks.length - 1]

  const creationUri =
    completedTask && completedTask.creation ? completedTask.creation.uri : false
  const creationId =
    completedTask && completedTask.creation ? completedTask.creation._id : false

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
      activeTask?.status === 'pending' &&
      noProgressGeneratorNames.includes(activeTask?.generator.generatorName)
    ) {
      timerId = setInterval(() => increaseFakeProgress(3, timerId), 1000)
    }

    return () => {
      clearInterval(timerId)
    }
  }, [activeTask])

  return (
    <div
      ref={innerRef}
      className="result-preview relative w-full flex flex-col rounded-lg border border-0 border-solid"
    >
      <Card
        className={`lg:sticky lg:top-4 w-full min-h-[512px] h-fit flex justify-center items-center`}
      >
        <div className="flex justify-center items-center h-full">
          {!(pendingTasks && pendingTasks?.length) &&
          !activeTask &&
          !completedTask ? (
            <div className={'text-gray-500'}>Results will appear here</div>
          ) : (
            <>
              {!creationUri ? (
                <div className="w-full">
                  <div className="text-center">
                    <div className="mb-4">
                      <div title={activeTask?.config.text_input || ''}>
                        <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                          <strong className="dark:text-gray-200 mr-1">
                            /{activeTask?.generator.generatorName}
                          </strong>
                          {activeTask?.config.text_input || ''}
                        </span>
                      </div>
                    </div>
                    <Button>
                      <span className="absolute">{pendingTasks?.length}</span>
                      <span className="loading loading-ring loading-xl"></span>
                    </Button>
                    {activeTask?.status === 'running' ? (
                      <Progress
                        percent={
                          fakeProgress > 0
                            ? fakeProgress
                            : activeTask?.progress
                            ? Math.round(activeTask.progress * 100)
                            : 0
                        }
                        status="active"
                        className="mt-2 flex items-center"
                      />
                    ) : (
                      <div className="mt-2">...</div>
                    )}
                  </div>
                  {activeTask && (
                    <div className="flex justify-between text-xs">
                      <div>
                        <div className="capitalize mb-2">
                          <strong>{activeTask.status}</strong>
                        </div>
                        <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
                          Started {timeAgo(activeTask.createdAt)}
                        </div>
                        <div className="text-xs text-gray-800 dark:text-gray-400">
                          Cost: <strong>{activeTask?.cost}</strong> Manna
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 cursor-copy"
                        onClick={() => handleCopyClick(activeTask.taskId)}
                      >
                        <div
                          className="italic text-gray-800 dark:text-gray-400"
                          title={activeTask.taskId}
                        >
                          {truncatedAddress(activeTask.taskId)}
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
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResultPreview
