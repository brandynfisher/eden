import ImageResult from '@/components/CreationInterface/media/ImageResult'
import VideoResult from '@/components/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'
import { formatDuration } from '@/lib/time'
import { Creation } from '@eden-labs/eden-sdk'
import { Badge } from 'antd'
import React from 'react'

const VideoLengthBadge = ({ duration }: { duration?: number }) => {
  return (
    <Badge size="small" className="rounded-full">
      <span className="inline-block bg-gray-800 text-white px-2 py-1 rounded-full">
        {duration ? formatDuration(duration) : '0:00'}
      </span>
    </Badge>
  )
}

const VideoPreview = ({ creation }: { creation: Creation }) => {
  return (
    <div className="rounded-lg overflow-hidden relative">
      <VideoResult resultUrl={creation.uri || ''} />
      <div className="absolute top-0 left-0 p-1">
        <VideoLengthBadge duration={creation.mediaAttributes.duration} />
      </div>
    </div>
  )
}

const CreationCardPreview = ({ creation }: { creation: Creation }) => {
  const { uri: creationUri } = creation

  const renderPreview = () => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    if (extension === 'jpg') {
      return <ImageResult resultUrl={creation.thumbnail || ''} />
    } else if (extension === 'mp4') {
      return <VideoPreview creation={creation} />
    }
    return null
  }

  return <>{renderPreview()}</>
}

export default CreationCardPreview
