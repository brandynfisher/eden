import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import { useState } from 'react'

const VideoResult = ({
  resultUrl,
  thumbnailUrl,
  aspectRatio,
  disableControls,
  onLoad,
}: {
  resultUrl: string
  thumbnailUrl?: string
  aspectRatio: number
  disableControls?: boolean
  onLoad?: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      <ImageResultZoomable
        thumbnailSizeUrl={thumbnailUrl}
        aspectRatio={aspectRatio}
        priority={true}
      >
        <video
          src={resultUrl}
          className={`w-full h-full object-contain absolute z-10 inset-0 rounded-lg opacity-40 ${
            isLoaded ? '!opacity-100' : ''
          }`}
          style={{ objectFit: 'contain', objectPosition: 'center' }}
          autoPlay={true}
          muted={true}
          loop={true}
          controls={!disableControls}
          onPlay={() => {
            setIsLoaded(true)
            onLoad && onLoad()
          }}
        />
      </ImageResultZoomable>
    </>
  )
}

export default VideoResult
