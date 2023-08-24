import ResultPreviewDisplay from '@/components/Creation/CreationInterface/ResultPreviewDisplay'
import { rightTruncatedString, truncatedAddress } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { LoadingOutlined } from '@ant-design/icons'
import { Card, Progress, Spin } from 'antd'
import React, { RefObject, useContext } from 'react'

const ResultPreview = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { hasChangedGenerator, pendingTasks, completedTasks, activeTaskId } =
    useContext(CreationNotificationContext)

  const activeTask = pendingTasks?.find(task => task.taskId === activeTaskId)
  const completedTask = completedTasks?.find(
    task => task.taskId === activeTaskId,
  )

  const creationUri =
    completedTask && completedTask.creation ? completedTask.creation.uri : false
  const creationId =
    completedTask && completedTask.creation ? completedTask.creation._id : false

  if (hasChangedGenerator || (!activeTask && !completedTask)) return null

  return (
    <div
      ref={innerRef}
      className="result-preview relative flex flex-col space-y-4 col-span-12 lg:col-span-6 rounded-lg border border-0 border-solid"
    >
      <Card
        className={`lg:sticky lg:top-4 w-full min-h-[512px] h-fit flex justify-center items-center`}
      >
        <div className="flex justify-center items-center h-full">
          {!creationUri ? (
            <div className="w-full">
              <div className="text-center">
                <div className="text-gray-500 mb-2">Awaiting creation... </div>
                <div className="mb-4">
                  <div className="font-bold mb-2">
                    /{activeTask?.generator.generatorName}
                  </div>
                  <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
                    {rightTruncatedString(
                      activeTask?.config.text_input || '',
                      30,
                    )}
                  </div>
                </div>
                <Spin
                  size="large"
                  indicator={
                    <LoadingOutlined className="text-grey-800 dark:text-gray-200" />
                  }
                />
                <Progress
                  percent={
                    activeTask?.progress
                      ? Math.round(activeTask.progress * 100)
                      : 0
                  }
                  status={
                    activeTask?.status === 'pending' ? 'normal' : 'active'
                  }
                  className="mt-2 flex items-center"
                />
              </div>
              <div className="flex justify-between text-xs">
                <div>
                  <div className="capitalize mb-2">
                    <strong>{activeTask?.status}</strong>
                  </div>
                  <div className="text-xs text-gray-800 dark:text-gray-400">
                    Started {timeAgo(activeTask ? activeTask?.createdAt : '')}
                  </div>
                </div>
                <div
                  className="italic text-gray-800 dark:text-gray-400"
                  title={activeTask?.taskId}
                >
                  {truncatedAddress(activeTask ? activeTask?.taskId : '')}
                </div>
              </div>
            </div>
          ) : (
            <ResultPreviewDisplay creationId={creationId} />
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResultPreview
