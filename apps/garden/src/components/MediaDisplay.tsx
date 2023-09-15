import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { isImageUrl, isVideoUrl } from '@/lib/string'

const MediaDisplay = ({
  creationUri,
  previewUri,
  showPreview,
  onLoad,
  className,
}: {
  creationUri: string
  previewUri?: string
  showPreview?: boolean
  onLoad?: () => void
  className?: string
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    if (isImageUrl(creationUri)) {
      return (
        <ImageResult
          previewSizeUrl={previewUri}
          fullSizeUrl={creationUri}
          showPreview={showPreview}
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
      className={`media-display max-h-full max-w-full lg:flex lg:flex-grow ${
        className ? className : ''
      }`}
    >
      <div className="rounded-xl overflow-hidden max-h-full max-w-full lg:flex lg:flex-grow lg:justify-center lg:items-start max-h-[90vh]">
        {renderPreview()}
      </div>
    </div>
  )
}

export default MediaDisplay
