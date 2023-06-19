import MediaDisplay from '@/components/MediaDisplay'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Card, Spin } from 'antd'
import React, { useContext } from 'react'

const ResultPreview = () => {
  const { hasChangedGenerator, completedTasks, activeTaskId } = useContext(
    CreationNotificationContext,
  )
  const activeTask =
    completedTasks && completedTasks.find(task => task.taskId === activeTaskId)
  const creationUri = activeTask && (activeTask.creation?.uri as string)

  if (hasChangedGenerator || !activeTask) return null
  return (
    <Card className="bg-gray-200 flex justify-center items-center">
      {!creationUri ? (
        <div className="text-center m-1">
          <Spin size="large" />
          <div className="text-gray-500 mt-4">Awaiting creation... </div>
        </div>
      ) : (
        <MediaDisplay creationUri={creationUri} />
      )}
    </Card>
  )
}

export default ResultPreview
