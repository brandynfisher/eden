import { cn } from '@/lib/utils'
import React, { useRef } from 'react'

type VideoProps = {
  videoUrl: string
  className?: string
  posterUrl?: string
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  muted?: boolean
  width?: number
  height?: number
}

const VideoResult: React.FC<VideoProps> = ({
  videoUrl,
  className,
  posterUrl,
  autoPlay = true,
  loop = true,
  controls = true,
  muted = true,
  width,
  height,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <video
      ref={videoRef}
      autoPlay={autoPlay}
      controls={controls}
      playsInline={autoPlay}
      src={videoUrl}
      loop={loop}
      muted={muted}
      width={width}
      height={height}
      controlsList={'nodownload'}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      className={cn(['w-full h-full outline-none', className])}
      poster={posterUrl}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  )
}

export default VideoResult
