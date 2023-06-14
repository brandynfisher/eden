import ImageResult from '@/components/CreationInterface/media/ImageResult'
import VideoResult from '@/components/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import React, { useContext } from 'react'

const ResultPreview = () => {
  const { hasChangedGenerator, completedTasks, activeTaskId } = useContext(
    CreationNotificationContext,
  )
  const activeTask =
    completedTasks && completedTasks.find(task => task.taskId === activeTaskId)
  const creationUri = activeTask && (activeTask.creation?.uri as string)

  const renderPreview = () => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    if (extension === 'jpg') {
      return <ImageResult resultUrl={creationUri} />
    } else if (extension === 'mp4') {
      return <VideoResult resultUrl={creationUri} />
    }
    return null
  }

  if (hasChangedGenerator || !activeTask) return null
  return <>{!creationUri ? <div>Awaiting creation...</div> : renderPreview()}</>
}

export default ResultPreview
