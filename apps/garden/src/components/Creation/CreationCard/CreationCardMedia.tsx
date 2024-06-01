import CardImage from '@/components/Card/CardImage'
import { VideoLengthBadge } from '@/components/Creation/CreationInterface/media/VideoPreview'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { ResponsiveImage } from '@/components/Media/ResponsiveImage'
import { Creation, MediaType } from '@edenlabs/eden-sdk'
import { useFullscreen } from '@mantine/hooks'

const CreationCardVideo = ({
  thumbnail,
  uri,
  width,
  height,
  duration,
  priority,
  hovered = false,
  sizes,
  allowFullscreenToggle,
}: {
  thumbnail: string
  uri: string
  width: number
  height: number
  duration: number
  priority?: boolean
  hovered?: boolean
  sizes?: string
  allowFullscreenToggle?: boolean
}) => {
  const { ref, toggle, fullscreen } = useFullscreen()

  return (
    <ResponsiveImage
      assetType="video"
      src={thumbnail}
      alt={thumbnail}
      aspectRatio={width / height}
      sizes={sizes || '(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 12vw'}
      priority={priority}
      onClick={allowFullscreenToggle ? toggle : () => null}
    >
      <>
        {(hovered || fullscreen) && (
          <div
            ref={ref}
            className={`absolute top-0 left-0 w-full h-full ${
              !fullscreen ? 'pointer-events-none' : ''
            }`}
          >
            <VideoResult
              src={uri}
              disableControls={!fullscreen}
              autoPlay={true}
            />
          </div>
        )}
        {!fullscreen ? (
          <div
            className={`absolute z-10 inset-0 flex flex-col justify-between items-center pointer-events-none ${
              hovered ? 'md:top-10 md:z-20' : ''
            }`}
          >
            <VideoLengthBadge duration={duration} />
          </div>
        ) : null}
      </>
    </ResponsiveImage>
  )
}

const CreationCardMedia = ({
  creation,
  hovered,
  priority,
  sizes,
  allowFullscreenToggle,
}: {
  creation: Creation
  hovered?: boolean
  priority?: boolean
  sizes?: string //media query like string for next/image.sizes
  allowFullscreenToggle?: boolean
}) => {
  if (creation.mediaAttributes.type === MediaType.Image) {
    return (
      <CardImage
        uri={creation.uri}
        width={creation.mediaAttributes.width || 0}
        height={creation.mediaAttributes.height || 0}
        priority={priority}
        sizes={sizes}
      />
    )
  }

  return (
    <CreationCardVideo
      thumbnail={creation.thumbnail || ''}
      uri={creation.uri}
      duration={creation.mediaAttributes.duration || 0}
      hovered={hovered}
      width={creation.mediaAttributes.width || 0}
      height={creation.mediaAttributes.height || 0}
      priority={priority}
      sizes={sizes}
      allowFullscreenToggle={allowFullscreenToggle}
    />
  )
}

export default CreationCardMedia
