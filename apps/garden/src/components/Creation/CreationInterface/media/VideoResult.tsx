import { useEffect, useRef } from 'react'

const VideoResult = ({
  src,
  muted,
  loop,
  disableControls,
  onLoad,
  onEnded,
  autoPlay,
  preload,
  className,
}: {
  src: string
  muted?: boolean
  loop?: boolean
  disableControls?: boolean
  onLoad?: () => void
  onEnded?: () => void
  autoPlay?: boolean
  preload?: boolean
  className?: string
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoNode = videoRef.current
    if (videoNode) {
      videoNode.src = ''
      videoNode.load()
      videoNode.src = src
    }

    return () => {
      if (videoNode) {
        videoNode.src = ''
        videoNode.load()
      }
    }
  }, [src])

  return (
    <div className={`ant-image z-10 ${className ? className : ''}`}>
      <video
        ref={videoRef}
        className="z-10 object-contain w-full h-full max-w-full rounded-lg max-h-screen max-w-screen"
        autoPlay={autoPlay}
        preload={preload ? 'auto' : undefined}
        muted={typeof muted !== 'undefined' ? muted : true}
        loop={typeof loop !== 'undefined' ? loop : true}
        controls={!disableControls}
        onPlay={onLoad}
        onEnded={onEnded}
      />
    </div>
  )
}

export default VideoResult
