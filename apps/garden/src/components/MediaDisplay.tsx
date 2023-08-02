import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'

const MediaDisplay = ({
  creationUri,
  previewUri,
  showPreview,
  onPreviewClose,
  onLoad,
}: {
  creationUri: string
  previewUri?: string
  showPreview?: boolean
  onPreviewClose?: () => void
  onLoad?: () => void
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    if (extension === 'jpg') {
      return (
        <ImageResult
          resultUrl={creationUri}
          previewUrl={previewUri ? creationUri : undefined}
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

  return (
    <div className="media-display max-h-full max-w-full lg:flex lg:flex-grow ">
      <div className="rounded-xl overflow-hidden max-h-full max-w-full lg:flex lg:flex-grow lg:justify-center lg:items-start max-h-[90vh]">
        {renderPreview()}
      </div>
    </div>
  )
}

export default MediaDisplay
