import 'photoswipe/dist/photoswipe.css'

import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import { useHover } from '@/hooks/use-hover'
import { siteConfig } from '@/lib/config'
import Image from 'next/image'
import React, { PropsWithChildren, useState } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'

// import PhotoSwipe from 'photoswipe'

type GalleryItem = {
  url?: string
  thumbnail?: string
  width?: number
  height?: number
  duration?: number
}

type LightboxGalleryItemProps = {
  item: GalleryItem
  forceRender?: boolean
}

export const LightboxGalleryItem = ({
  item,
  forceRender,
}: LightboxGalleryItemProps) => {
  const { hovered, ref: hoverRef } = useHover()
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)

  return (
    <Item
      original={
        item.url?.endsWith('.mp4')
          ? undefined
          : item.url || siteConfig.mediaErrorUrl
      }
      thumbnail={item.thumbnail || siteConfig.mediaErrorUrl}
      width={item?.width || 1024}
      height={item?.height || 1024}
      content={
        item.url?.endsWith('.mp4') ? (
          <VideoResult
            videoUrl={item.url || siteConfig.mediaErrorUrl}
            width={item.width || 1024}
            height={item.height || 1024}
            posterUrl={item.thumbnail || siteConfig.mediaErrorUrl}
            muted={true}
            loop={true}
            autoPlay={true}
            controls={true}
          />
        ) : undefined
      }
    >
      {({ ref, open }) => (
        <div className="flex max-w-full max-h-full" ref={hoverRef}>
          <Image
            ref={ref}
            onClick={open}
            src={item.thumbnail || siteConfig.mediaErrorUrl}
            alt={item.url || ''}
            objectFit={'contain'}
            // fill={true}
            width={item.width || 1024}
            height={item.height || 1024}
            // style={{ width: '100%', height: 'auto', maxHeight: '100%' }} // optional
            // className="object-contain w-full h-auto max-h-full cursor-zoom-in"
            className="absolute object-contain w-full h-full  max-h-full cursor-zoom-in"
          />
          {item.url?.endsWith('.mp4') ? (
            <>
              {(forceRender || hovered) && !hasStartedPlayback ? (
                <div className="absolute inset-0 h-full w-full flex items-center justify-center pointer-events-none">
                  <LoadingIndicator className="h-16 w-16" />
                </div>
              ) : null}
              {forceRender || hovered ? (
                <VideoResult
                  className="absolute inset-0 cursor-zoom-in pointer-events-none"
                  videoUrl={item.url || ''}
                  width={item.width || 1024}
                  height={item.height || 1024}
                  posterUrl={item.thumbnail || siteConfig.mediaErrorUrl}
                  muted={true}
                  loop={true}
                  autoPlay={forceRender ? true : hovered}
                  controls={forceRender ? true : false}
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

// type Props = {
//   items: GalleryItem[]
// }

const LightboxGallery = ({ children }: PropsWithChildren) => {
  // const galleryRef = useRef(null);
  //
  // const handleOnOpen = (photoswipeInstance: PhotoSwipe) => {
  //   console.log('handleOnOpen')
  //   console.log(photoswipeInstance)
  //   photoswipeInstance?.container?.addEventListener('click', (evt) => {
  //     console.log('evt', evt)
  //   })
  // }

  return (
    // <Gallery options={{ bgOpacity: 1 }} onBeforeOpen={handleOnOpen}>
    <Gallery options={{ bgOpacity: 1 }} withDownloadButton={true}>
      {children}
    </Gallery>
  )
}

export default LightboxGallery
