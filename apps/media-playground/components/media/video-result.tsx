import { cn } from '@/lib/utils'
import React, { useRef, useState } from 'react'

type Props = {
  className?: string
  width?: number
  height?: number
  videoUrl: string
  posterUrl?: string
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  allowFullscreen?: boolean
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
  allowFullscreen = false,
  muted = true,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [initialPlay, setInitialPlay] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleVideoClick = async (ev: React.MouseEvent) => {
    if (videoRef.current) {
      const videoElement = videoRef.current as HTMLVideoElement

      if (allowFullscreen) {
        ev.stopPropagation()
        if (videoElement.paused) {
          setIsPlaying(false)
        } else {
          setIsPlaying(true)
        }

        await videoElement.requestFullscreen()

        if (!isPlaying) {
          await videoElement.play()
        }
      } else {
        if (videoElement.paused) {
          await videoElement.play()
          setInitialPlay(true)
        } else {
          setIsPlaying(false)
        }
      }
    }
  }

  return (
    <video
      ref={videoRef}
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
