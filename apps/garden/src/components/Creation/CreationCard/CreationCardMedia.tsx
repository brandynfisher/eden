import { VideoLengthBadge } from '@/components/Creation/CreationInterface/media/VideoPreview'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { isImageUrl } from '@/lib/string'
import { Creation } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import { ReactNode } from 'react'

const ResponsiveImage = ({
  src,
  alt,
  aspectRatio,
  sizes,
  priority,
  children,
}: {
  src: string
  alt: string
  aspectRatio: number
  sizes?: string
  priority?: boolean
  children?: ReactNode
}) => {
  return (
    <div
      className="relative w-full bg-gray-100 dark:bg-gray-800"
      style={{ aspectRatio: aspectRatio }}
    >
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        width={0}
        height={0}
        // quality={35}
        priority={priority}
        className="rounded-lg h-full w-full object-contain"
      />
      {children}
    </div>
  )
}

const CreationCardImage = ({
  uri,
  width,
  height,
  priority,
}: {
  uri: string
  width: number
  height: number
  priority?: boolean
}) => {
  return (
    <ResponsiveImage
      src={uri}
      alt={uri}
      aspectRatio={width / height}
      sizes={'(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 15vw'}
      priority={priority}
    />
  )
}

const CreationCardVideo = ({
  thumbnail,
  uri,
  width,
  height,
  duration,
  priority,
  hovered = false,
}: {
  thumbnail: string
  uri: string
  width: number
  height: number
  duration: number
  priority?: boolean
  hovered?: boolean
}) => {
  return (
    <ResponsiveImage
      src={thumbnail}
      alt={thumbnail}
      aspectRatio={width / height}
      sizes={'(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 15vw'}
      priority={priority}
    >
      <>
        {hovered && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <VideoResult resultUrl={uri} disableControls />
          </div>
        )}
        <div
          className={`absolute z-10 inset-0 flex flex-col justify-between items-center pointer-events-none ${
            hovered ? 'md:top-10 md:z-20' : ''
          }`}
        >
          <VideoLengthBadge duration={duration} />
        </div>
      </>
    </ResponsiveImage>
  )
}

const CreationCardMedia = ({
  creation,
  hovered,
  priority,
}: {
  creation: Creation
  hovered?: boolean
  priority?: boolean
}) => {
  if (isImageUrl(creation.uri)) {
    return (
      <CreationCardImage
        uri={creation.uri}
        width={creation.mediaAttributes.width || 0}
        height={creation.mediaAttributes.height || 0}
        priority={priority}
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
    />
  )
}

export default CreationCardMedia
