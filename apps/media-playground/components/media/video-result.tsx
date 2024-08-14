import { cn } from '@/lib/utils'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type VideoProps = {
  videoUrl: string
  className?: string
  posterUrl?: string
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  allowFullscreen?: boolean
  muted?: boolean
  width?: number
  height?: number
}

const VideoCard: React.FC<VideoProps> = ({
  videoUrl,
  className,
  posterUrl,
  autoPlay = true,
  loop = true,
  controls = true,
  allowFullscreen = false,
  muted = true,
  width,
  height,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const safePlay = useCallback(() => {
    if (videoRef.current) {
      setPlaying(true)
      videoRef.current.play().catch(() => setPlaying(false))
    }
  }, [])

  const safePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setPlaying(false)
    }
  }, [])

  const handleMouseOver = safePlay
  const handleMouseOut = safePause

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault()

    if (videoRef.current) {
      if (document.fullscreenElement === null && allowFullscreen) {
        await videoRef.current.requestFullscreen()
      }

      if (playing) {
        safePause()
      } else {
        safePlay()
      }
    }
  }

  useEffect(() => {
    return () => {
      safePause()
    }
  }, [safePause])

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
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  )
}

export default VideoCard
