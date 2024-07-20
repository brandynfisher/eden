import { PlayIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'

type VideoPlayerProps = {
  src: string
  width: number
  height: number
}

const PreviewVideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  width,
  height,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (videoRef.current.paused) {
        setIsPlaying(true)
        await videoRef.current.play()
      } else {
        setIsPlaying(false)
        videoRef.current.pause()
      }
    }
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      <video
        preload="none"
        ref={videoRef}
        src={src}
        loop={true}
        autoPlay={false}
        controls={false}
        controlsList={'nodownload'}
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
        width={width}
        height={height}
      />
      <div
        className="absolute inset-0 flex justify-center items-center"
        onClick={handlePlayPause}
      >
        {!isPlaying ? (
          <div className="bg-popover rounded-full p-1 bg-opacity-50">
            <PlayIcon size={16} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PreviewVideoPlayer
