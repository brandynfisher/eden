import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import VideoResultV2 from '@/components/Creation/CreationInterface/media/VideoResultV2'
import { CONFIG } from '@/lib/config'
import { isImageUrl, isVideoUrl } from '@/lib/string'

const MediaDisplay = ({
  creationUri,
  previewUri,
  thumbnailUri,
  showPreview,
  onLoad,
  className,
  aspectRatio,
  priority,
}: {
  creationUri: string
  previewUri?: string
  thumbnailUri?: string
  showPreview?: boolean
  onLoad?: () => void
  className?: string
  aspectRatio: number
  priority?: boolean
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    if (isImageUrl(creationUri)) {
      return (
        <ImageResultZoomable
          aspectRatio={aspectRatio}
          previewSizeUrl={
            previewUri || `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
          }
          fullSizeUrl={creationUri}
          thumbnailSizeUrl={thumbnailUri}
          showPreview={showPreview}
          onLoad={onLoad}
          priority={priority}
        />
      )
    } else if (isVideoUrl(creationUri)) {
      return (
        <VideoResultV2
          resultUrl={creationUri}
          thumbnailUrl={thumbnailUri}
          onLoad={onLoad}
          aspectRatio={aspectRatio}
        />
      )
    }
    return null
  }

  return (
    <div
      className={`media-display relative max-h-full max-w-full flex flex-grow ${
        className ? className : ''
      }`}
    >
      {renderPreview()}
    </div>
  )
}

export default MediaDisplay
