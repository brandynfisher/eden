import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoPreview from '@/components/Creation/CreationInterface/media/VideoPreview'
import { isImageUrl, isVideoUrl } from '@/lib/string'
import { Creation } from '@edenlabs/eden-sdk'

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
      <ImageResult
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
