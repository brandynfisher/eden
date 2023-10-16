import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'

// import { useState } from 'react'

const VideoResultV2 = ({
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
  // const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      <ImageResultZoomable
        thumbnailSizeUrl={thumbnailUrl}
        aspectRatio={aspectRatio}
        priority={true}
      >
        <video
          src={resultUrl}
          className={`w-full h-full object-contain absolute z-10 inset-0 rounded-lg max-h-[95vh]`}
          style={{ objectFit: 'contain', objectPosition: 'top center' }}
          autoPlay={true}
          muted={false}
          loop={true}
          controls={!disableControls}
          onPlay={() => {
            console.log('onPlay', resultUrl)
            // setIsLoaded(true)
            onLoad && onLoad()
          }}
        />
      </ImageResultZoomable>
    </>
  )
}

export default VideoResultV2
