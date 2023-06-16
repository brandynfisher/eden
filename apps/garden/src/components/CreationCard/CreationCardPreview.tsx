import ImageResult from '@/components/CreationInterface/media/ImageResult'
import { getFileExtension } from '@/lib/getFileExtension'
import { Creation } from '@eden-labs/eden-sdk'
import { Badge } from 'antd'
import React from 'react'

const VideoLengthBadge = () => {
  return (
    <Badge size="small" className="rounded-full">
      <span className="inline-block bg-gray-500 text-white px-2 py-1 rounded-full">
        video
      </span>
    </Badge>
  )
}

const VideoPreview = ({ creation }: { creation: Creation }) => {
  return (
    <div>
      <ImageResult resultUrl={creation.thumbnail || ''} />
      <div className="absolute top-0 left-0 p-1">
        <VideoLengthBadge />
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
