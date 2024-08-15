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
  // const [playing, setPlaying] = useState(false)
  //
  // const safePlay = useCallback(() => {
  //   if (videoRef.current) {
  //     setPlaying(true)
  //     videoRef.current.play().catch(() => setPlaying(false))
  //   }
  // }, [])

  // const safePause = useCallback(() => {
  //   if (videoRef.current) {
  //     videoRef.current.pause()
  //     setPlaying(false)
  //   }
  // }, [])

  // const handleMouseOver = safePlay
  // const handleMouseOut = safePause

  // const handleClick = async (event: React.MouseEvent) => {
  //   event.preventDefault();
  //   event.stopPropagation()
  //   console.log({isFullscreen, allowFullscreen, el: document.fullscreenElement})
  //   if (videoRef.current) {
  //     if (!isFullscreen && allowFullscreen && document.fullscreenElement === null) {
  //         // setTimeout(async () => {
  //         //   console.log('setIsFullscreen')
  //           // await videoRef.current?.requestFullscreen();
  //           // setIsFullscreen(true);
  //
  //           if (!playing) {
  //             safePlay();
  //           }
  //           // await videoRef.current.requestFullscreen();
  //         // }, 300); // Increase the delay to 300ms or experiment with different values
  //     } else {
  //
  //       // if (playing) {
  //       //   safePause();
  //       // }
  //
  //       // setIsFullscreen(false);
  //     }
  //   }
  // }

  // useEffect(() => {
  //   return () => {
  //     safePause()
  //   }
  // }, [safePause])

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
      // onMouseOver={handleMouseOver}
      // onMouseOut={handleMouseOut}
      // onClick={handleClick}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  )
}

export default VideoResult
