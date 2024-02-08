import ImageResultZoomable from '@/components/Creation/CreationInterface/media/ImageResultZoomable'
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

  return (
    <>
      <ImageResultZoomable
        thumbnailSizeUrl={thumbnailUrl}
        aspectRatio={aspectRatio}
        priority={true}
      >
        <ReactPlayer
          // url={
          //   'https://dtut5r9j4w7j4.cloudfront.net/fae426e3ae2c96ead8cb0436c5799ca46dee05b0ce99e7835efc6cb2e73773c6.mp4'
          // }
          // url={
          //   'https://d2b32k6ob16fpt.cloudfront.net/hls/fae426e3ae2c96ead8cb0436c5799ca46dee05b0ce99e7835efc6cb2e73773c6/fae426e3ae2c96ead8cb0436c5799ca46dee05b0ce99e7835efc6cb2e73773c6_mp4_master.m3u8'
          // }
          url={resultUrl}
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
          config={{
            file: {
              forceHLS: true,
            },
          }}
        />
      </ImageResultZoomable>
    </>
  )
}

export default VideoResultV2
