import React, { Ref, useRef, useState } from 'react'

type Props = {
  width?: number
  height?: number
  videoUrl: string
  posterUrl?: string
}

const TimelineItemVideo = ({ width, height, videoUrl, posterUrl }: Props) => {
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
      loop={true}
      controls={true}
      autoPlay={false}
      controlsList={'nodownload'}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      className="w-full h-full"
      width={width || 1024}
      height={height || 1024}
      preload={'none'}
      onClick={!initialPlay ? handleVideoClick : undefined}
    />
  )
}

export default TimelineItemVideo
