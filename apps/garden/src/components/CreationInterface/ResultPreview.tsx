import MediaDisplay from '@/components/MediaDisplay'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
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
    <>
      {!creationUri ? (
        <div>Awaiting creation...</div>
      ) : (
        <MediaDisplay creationUri={creationUri} />
      )}
    </>
  )
}

export default ResultPreview
