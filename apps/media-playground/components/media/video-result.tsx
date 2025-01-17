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
  allowDownload?: boolean
  width?: number
  height?: number
  onPlay?: () => void
}

const VideoResult: React.FC<VideoProps> = ({
  videoUrl,
  className,
  posterUrl,
  width,
  height,
  onPlay,
  autoPlay = true,
  loop = true,
  controls = true,
  muted = true,
  allowDownload = false,
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
      controlsList={allowDownload ? undefined : 'nodownload'}
      onContextMenu={
        allowDownload ? undefined : (e: React.MouseEvent) => e.preventDefault()
      }
      className={cn(['w-full h-full outline-none', className])}
      poster={posterUrl}
      onPlay={onPlay}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  )
}

export default VideoResult
