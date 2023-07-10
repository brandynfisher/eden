import MediaDisplay from '@/components/MediaDisplay'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Card, Progress, Spin } from 'antd'
import React, { useContext } from 'react'

const ResultPreview = () => {
  const { hasChangedGenerator, pendingTasks, completedTasks, activeTaskId } =
    useContext(CreationNotificationContext)
  const activeTask = pendingTasks?.find(task => task.taskId === activeTaskId)
  const completedTask = completedTasks?.find(
    task => task.taskId === activeTaskId,
  )

  const creationUri = completedTask?.creation.uri

  if (hasChangedGenerator || (!activeTask && !completedTask)) return null
  return (
    <div className="relative flex flex-col space-y-4 col-span-12 lg:mt-9 lg:col-span-6 rounded-lg border border-0 border-solid ">
      <Card
        className={`lg:sticky lg:top-4 w-full h-full max-h-[512px] flex justify-center items-center`}
      >
        <div className="flex justify-center items-center">
          {!creationUri ? (
            <div className="text-center m-1">
              <Spin size="large" />
              <div className="text-gray-500 mt-6">Awaiting creation... </div>
              <Progress
                percent={
                  activeTask?.progress
                    ? Math.round(activeTask.progress * 100)
                    : 0
                }
                status="active"
                className="mt-4 flex items-center"
              />
            </div>
          ) : (
            <>
              <MediaDisplay creationUri={creationUri} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResultPreview
