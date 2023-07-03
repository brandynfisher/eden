import MediaDisplay from '@/components/MediaDisplay'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Progress, Spin } from 'antd'
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
    <div className="flex justify-center items-center">
      {!creationUri ? (
        <div className="text-center m-1">
          <Spin size="large" />
          <div className="text-gray-500 mt-4">Awaiting creation... </div>
          <Progress
            percent={activeTask?.progress ? activeTask.progress * 100 : 0}
            status="active"
            className="mt-1 flex items-center"
          />
        </div>
      ) : (
        <>
          <MediaDisplay creationUri={creationUri} />
        </>
      )}
    </div>
  )
}

export default ResultPreview
