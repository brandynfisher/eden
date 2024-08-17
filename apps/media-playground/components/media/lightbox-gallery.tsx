import 'photoswipe/dist/photoswipe.css'

import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import { useHover } from '@/hooks/use-hover'
import Image from 'next/image'
import React, { useState } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'

type GalleryItem = {
  url?: string
  thumbnail?: string
  width?: number
  height?: number
  duration?: number
}

type LightboxGalleryItemProps = {
  item: GalleryItem
}
const LightboxGalleryItem = ({ item }: LightboxGalleryItemProps) => {
  const { hovered, ref: hoverRef } = useHover()
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)
  return (
    <Item
      original={item.url?.endsWith('.mp4') ? undefined : item.url}
      thumbnail={item.thumbnail}
      width={item?.width}
      height={item?.height}
      content={
        item.url?.endsWith('.mp4') ? (
          <VideoResult
            videoUrl={item.url || ''}
            width={item.width}
            height={item.height}
            posterUrl={item.thumbnail}
            muted={true}
            loop={true}
            autoPlay={true}
            controls={true}
          />
        ) : undefined
      }
    >
      {({ ref, open }) => (
        <div ref={hoverRef}>
          <Image
            ref={ref}
            onClick={open}
            src={item.thumbnail || ''}
            alt={item.url || ''}
            objectFit={'cover'}
            width={item.width}
            height={item.height}
            className="object-cover w-full cursor-zoom-in"
          />
          {item.url?.endsWith('.mp4') ? (
            <>
              {hovered && !hasStartedPlayback ? (
                <div className="absolute inset-0 h-full w-full flex items-center justify-center pointer-events-none">
                  <LoadingIndicator className="h-16 w-16" />
                </div>
              ) : null}
              {hovered ? (
                <VideoResult
                  className="absolute inset-0 cursor-zoom-in pointer-events-none"
                  videoUrl={item.url || ''}
                  width={item.width}
                  height={item.height}
                  posterUrl={item.thumbnail}
                  muted={true}
                  loop={true}
                  autoPlay={true}
                  controls={false}
                  onPlay={() => setHasStartedPlayback(true)}
                />
              ) : (
                <VideoDurationBadge duration={item.duration} />
              )}
            </>
          ) : null}
        </div>
      )}
    </Item>
  )
}

type Props = {
  items: GalleryItem[]
}

const LightboxGallery = ({ items }: Props) => {
  return (
    <Gallery options={{ bgOpacity: 1 }}>
      {items.map(item => (
        <LightboxGalleryItem key={item.url} item={item} />
      ))}
    </Gallery>
  )
}

export default LightboxGallery
