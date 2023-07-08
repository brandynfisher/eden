import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { getFileExtension } from '@/lib/getFileExtension'

const MediaDisplay = ({
  creationUri,
  fullscreen,
}: {
  creationUri: string
  fullscreen?: boolean
}) => {
  const renderPreview = () => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    if (extension === 'jpg') {
      return <ImageResult resultUrl={creationUri} />
    } else if (extension === 'mp4') {
      return <VideoResult resultUrl={creationUri} />
    }
    return null
  }

  return (
    <div
      className={`media-display ${
        fullscreen
          ? 'flex justify-center w-[calc(100vw-30px)] h-[calc(100vh-60px)]'
          : 'max-h-full max-w-full'
      }`}
    >
      <div className="flex rounded-xl overflow-hidden">{renderPreview()}</div>
    </div>
  )
}

export default MediaDisplay
