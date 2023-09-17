import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { CONFIG } from '@/lib/config'
import { isImageUrl, isVideoUrl } from '@/lib/string'

const MediaDisplay = ({
  creationUri,
  previewUri,
  showPreview,
  onLoad,
  className,
  width,
  height,
}: {
  creationUri: string
  previewUri?: string
  showPreview?: boolean
  onLoad?: () => void
  className?: string
  width: number
  height: number
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    if (isImageUrl(creationUri)) {
      if (creationUri && previewUri) {
        return (
          <ImageResultZoomable
            width={width}
            height={height}
            previewSizeUrl={previewUri}
            fullSizeUrl={creationUri}
            showPreview={showPreview}
            onLoad={onLoad}
          />
        )
      }

      return (
        <ImageResult
          width={width}
          height={height}
          previewSizeUrl={
            previewUri || `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
          }
          onLoad={onLoad}
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
      <div className="rounded-xl overflow-hidden max-h-full max-w-full flex flex-grow lg:justify-center lg:items-start max-h-[90vh]">
        {renderPreview()}
      </div>
    </div>
  )
}

export default MediaDisplay
