import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
import { getCldVideoUrl } from '@/components/Media/helpers/getCldVideoUrl'
import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

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
  const [isMounted, setIsMounted] = useState(false)

  const optimizedVideoUrl = resultUrl.startsWith('https://res.cloudinary.com/')
    ? getCldVideoUrl({
        src: resultUrl,
      }) + '.mp4'
    : resultUrl

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
    }
  }, [])

  return (
    <>
      <ImageResultZoomable
        thumbnailSizeUrl={thumbnailUrl}
        aspectRatio={aspectRatio}
        priority={true}
      >
        {isMounted ? (
          <ReactPlayer
            url={optimizedVideoUrl}
            className={`w-full h-full object-contain absolute z-10 inset-0 rounded-lg max-h-[80vh]`}
            style={{ objectFit: 'contain', objectPosition: 'top center' }}
            width="100%"
            height="100%"
            playing={true}
            muted={false}
            loop={true}
            controls={!disableControls}
            onPlay={() => {
              onLoad && onLoad()
            }}
            preload="none"
            // config={{
            //   file: {
            //     forceHLS: true,
            //   },
            // }}
          />
        ) : null}
      </ImageResultZoomable>
    </>
  )
}

export default VideoResultV2
