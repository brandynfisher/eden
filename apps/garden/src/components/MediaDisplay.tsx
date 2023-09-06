import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'

const MediaDisplay = ({
  creationUri,
  previewUri,
  showPreview,
  onPreviewClose,
  onLoad,
  className,
}: {
  creationUri: string
  previewUri?: string
  showPreview?: boolean
  onPreviewClose?: () => void
  onLoad?: () => void
  className?: string
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    if (extension === 'jpg') {
      return (
        <ImageResult
          previewSizeUrl={previewUri}
          fullSizeUrl={creationUri}
          showPreview={showPreview}
          onPreviewClose={onPreviewClose}
          onLoad={onLoad}
        />
      )
    } else if (extension === 'mp4') {
      return <VideoResult resultUrl={creationUri} onLoad={onLoad} />
    }
    return null
  }

  // @todo: add prop to swap className that then swaps css bevhaviour
  return (
    <div
      className={`media-display max-h-full max-w-full lg:flex lg:flex-grow ${className}`}
    >
      <div className="rounded-xl overflow-hidden max-h-full max-w-full lg:flex lg:flex-grow lg:justify-center lg:items-start max-h-[90vh]">
        {renderPreview()}
      </div>
    </div>
  )
}

export default MediaDisplay
