import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoPreview from '@/components/Creation/CreationInterface/media/VideoPreview'
import { getFileExtension } from '@/lib/getFileExtension'
import { Creation } from '@eden-labs/eden-sdk'

const MediaPreview = ({
  creation,
  hovered,
}: {
  creation: Creation
  hovered?: boolean
}) => {
  if (!creation.uri) return null
  const extension = getFileExtension(creation.uri)
  if (extension === 'jpg') {
    return <ImageResult resultUrl={creation.thumbnail || ''} />
  } else if (extension === 'mp4') {
    return <VideoPreview creation={creation} hovered={hovered} />
  }
  return null
}

export default MediaPreview
