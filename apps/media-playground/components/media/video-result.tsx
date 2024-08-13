import { cn } from '@/lib/utils'
import React, { Ref, useRef, useState } from 'react'

type Props = {
  className?: string
  width?: number
  height?: number
  videoUrl: string
  posterUrl?: string
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  muted?: boolean
}

const VideoResult = ({
  className,
  width,
  height,
  videoUrl,
  posterUrl,
  loop,
  autoPlay,
  controls,
  muted = true,
}: Props) => {
  const [initialPlay, setInitialPlay] = useState(false)
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)

  const handleVideoClick = async () => {
    const videoElement = mediaRef.current as HTMLVideoElement

    if (videoElement.paused) {
      await videoElement.play()
      setInitialPlay(true)
    }
  }

  return (
    <video
      ref={mediaRef as Ref<HTMLVideoElement>}
      poster={posterUrl}
      src={videoUrl}
      loop={loop}
      muted={muted}
      controls={controls}
      autoPlay={autoPlay}
      playsInline={autoPlay}
      controlsList={'nodownload'}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      className={cn(['w-full h-full outline-none', className])}
      width={width || 1024}
      height={height || 1024}
      preload={'none'}
      onClick={!initialPlay ? handleVideoClick : undefined}
    />
  )
}

export default VideoResult
