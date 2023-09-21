import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import VideoPreview from '@/components/Creation/CreationInterface/media/VideoPreview'
import { isImageUrl, isVideoUrl } from '@/lib/string'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const MediaPreview = ({
  creation,
  hovered,
  aspectRatio,
}: {
  creation: Creation
  hovered?: boolean
  aspectRatio: number
}) => {
  if (!creation.uri) return null
  if (isImageUrl(creation.uri)) {
    return (
      <ImageResultZoomable
        previewSizeUrl={creation.thumbnail || ''}
        aspectRatio={aspectRatio}
      />
    )
  } else if (isVideoUrl(creation.uri)) {
    return <VideoPreview creation={creation} hovered={hovered} />
  }
  return null
}

export default MediaPreview
