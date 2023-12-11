import MediaDisplay from '@/components/MediaDisplay'
import { getAspectRatio } from '@/lib/media'
import { isImageUrl } from '@/lib/string'
import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const CreationMedia = ({ creation }: { creation: Creation }) => {
  const aspectRatio = getAspectRatio(
    creation.mediaAttributes.width,
    creation.mediaAttributes.height,
  )

  return isImageUrl(creation.uri) ? (
    <MediaDisplay
      priority={true}
      aspectRatio={aspectRatio}
      creationUri={creation?.uri}
      previewUri={creation?.uri}
      thumbnailUri={creation?.thumbnail}
    />
  ) : (
    <MediaDisplay
      aspectRatio={aspectRatio}
      creationUri={creation?.uri}
      thumbnailUri={creation?.thumbnail}
    />
  )
}

export default CreationMedia
