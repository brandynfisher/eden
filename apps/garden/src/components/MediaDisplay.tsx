import ImageResult from '@/components/CreationInterface/media/ImageResult'
import VideoResult from '@/components/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'
import React from 'react'

const MediaDisplay = ({ creationUri }: { creationUri: string }) => {
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

  return <div>{renderPreview()}</div>
}

export default MediaDisplay
