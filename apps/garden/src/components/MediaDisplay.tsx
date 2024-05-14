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
  limitHeight,
}: {
  creationUri: string
  previewUri?: string
  thumbnailUri?: string
  showPreview?: boolean
  onLoad?: () => void
  className?: string
  aspectRatio: number
  priority?: boolean
  limitHeight?: boolean
}) => {
  // const [ adjustedAspectRatio, setAdjustedAspectRatio ] = useState(aspectRatio)
  // const { ref, width, height } = useElementSize();

  // useEffect(() => {
  //   if (!contained) return
  //
  //   if (ref) {
  //     const roundedWidth = Number(width.toFixed(0))
  //     const roundedHeight = Number(height.toFixed(0))
  //
  //     const containerHeight = roundedHeight
  //     const imageHeight = (roundedWidth * aspectRatio) / 100
  //
  //     if (imageHeight > containerHeight) {
  //       const newAspectRatio = parseFloat(((containerHeight / roundedWidth) * 100).toFixed(0))
  //       setAdjustedAspectRatio(newAspectRatio)
  //       console.log('SETTING NEW ASPECT RATIO', newAspectRatio)
  //     } else {
  //       setAdjustedAspectRatio(aspectRatio)
  //     }
  //   }
  // }, [ref, height, width, aspectRatio])

  const renderPreview = () => {
    if (!creationUri) return null
    if (isImageUrl(creationUri)) {
      return (
        <ImageResultZoomable
          key={creationUri}
          aspectRatio={aspectRatio}
          previewSizeUrl={previewUri}
          fullSizeUrl={creationUri}
          thumbnailSizeUrl={thumbnailUri}
          showPreview={showPreview}
          onLoad={onLoad}
          priority={priority}
          limitHeight={limitHeight}
        />
      )
    } else if (isVideoUrl(creationUri)) {
      return (
        <VideoResultV2
          key={creationUri}
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
      // ref={ref}
      // className={`media-display relative max-h-[85vh] h-full max-w-full flex flex-grow ${
      className={`media-display relative max-w-full flex flex-grow ${
        className ? className : ''
      }`}
    >
      {renderPreview()}
    </div>
  )
}

export default MediaDisplay
