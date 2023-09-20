import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
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
      if (creationUri && previewUri) {
        return (
          <ImageResultZoomable
            aspectRatio={aspectRatio}
            previewSizeUrl={previewUri}
            fullSizeUrl={creationUri}
            thumbnailSizeUrl={thumbnailUri}
            showPreview={showPreview}
            onLoad={onLoad}
            priority={priority}
          />
        )
      }

      return (
        <ImageResult
          aspectRatio={aspectRatio}
          previewSizeUrl={
            previewUri || `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
          }
          onLoad={onLoad}
          priority={priority}
        />
      )
    } else if (isVideoUrl(creationUri)) {
      return <VideoResult resultUrl={creationUri} onLoad={onLoad} />
    }
    return null
  }

  return (
    <div
      className={`media-display max-h-full max-w-full flex flex-grow ${
        className ? className : ''
      }`}
    >
      {/*<div className="rounded-xl overflow-hidden max-h-full max-w-full flex flex-grow lg:justify-center lg:items-start max-h-[90vh]">*/}
      {renderPreview()}
      {/*</div>*/}
    </div>
  )
}

export default MediaDisplay
