import 'photoswipe/dist/photoswipe.css'

import { MediaDurationBadge } from '@/components/badge/media-duration-badge'
// import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import { useHover } from '@/hooks/use-hover'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import NextImage from 'next/image'
import PhotoSwipe from 'photoswipe'
import React, { PropsWithChildren, useState } from 'react'
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
  forceRender?: boolean
  className?: string
  sizeOnLoad?: boolean
}

export const LightboxGalleryItem = ({
  sizeOnLoad,
  item,
  forceRender,
  className,
}: LightboxGalleryItemProps) => {
  const { hovered, ref: hoverRef } = useHover()
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)
  const width = item.width || 1024
  const height = item.height || 1024
  return (
    <Item
      original={
        item.url?.endsWith('.mp4')
          ? undefined
          : item.url || siteConfig.mediaErrorUrl
      }
      thumbnail={item.thumbnail || siteConfig.mediaErrorUrl}
      width={sizeOnLoad ? undefined : width}
      height={sizeOnLoad ? undefined : height}
      content={
        item.url?.endsWith('.mp4') ? (
          <VideoResult
            videoUrl={item.url || siteConfig.mediaErrorUrl}
            width={width}
            height={height}
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
        <div className={`flex max-w-full max-h-full`} ref={hoverRef}>
          <NextImage
            ref={ref}
            onClick={ev => {
              ev.stopPropagation()
              open(ev)
            }}
            src={item.thumbnail || siteConfig.mediaErrorUrl}
            alt={item.url || ''}
            width={width}
            height={height}
            className={cn([
              `object-contain cursor-zoom-in md:h-full w-full`,
              className,
            ])}
          />
          {item.url?.endsWith('.mp4') ? (
            <>
              {!forceRender ? (
                <MediaDurationBadge
                  duration={item.duration}
                  isLoading={hovered && hasStartedPlayback}
                />
              ) : null}
              {forceRender || hovered ? (
                <VideoResult
                  className={cn([
                    'absolute inset-0 cursor-zoom-in md:h-full',
                    forceRender ? '' : 'pointer-events-none',
                    className,
                  ])}
                  videoUrl={item.url || ''}
                  width={width}
                  height={height}
                  posterUrl={item.thumbnail || siteConfig.mediaErrorUrl}
                  muted={true}
                  loop={true}
                  autoPlay={forceRender}
                  controls={!!forceRender}
                  onPlay={() => setHasStartedPlayback(true)}
                />
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </Item>
  )
}

type LightboxGalleryProps = {
  sizeOnLoad?: boolean
  withDownloadButton?: boolean
} & PropsWithChildren

const LightboxGallery = ({
  children,
  sizeOnLoad,
  withDownloadButton,
}: LightboxGalleryProps) => {
  const handleOnBeforeOpen = (psInstance: PhotoSwipe) => {
    const ds = psInstance?.options?.dataSource
    // console.log({ds})
    if (Array.isArray(ds)) {
      for (let idx = 0, len = ds.length; idx < len; idx++) {
        const item = ds[idx]
        const img = new Image()
        img.onload = () => {
          item.width = img.naturalWidth
          item.height = img.naturalHeight
          psInstance?.refreshSlideContent(idx)
        }
        img.src = item.src as string
      }
    }
  }

  const handleOnOpen = (psInstance: PhotoSwipe) => {
    console.log({ psInstance })
  }

  return (
    <Gallery
      options={{
        bgOpacity: 1,
        preloaderDelay: 1000,
        // getViewportSizeFn: function(options, pswp) {
        //   const size = {
        //     x: document.documentElement.clientWidth - 200,
        //     y: window.innerHeight,
        //   }
        //
        //   console.log({size})
        //
        //   return size
        // },
      }}
      withDownloadButton={withDownloadButton}
      onBeforeOpen={sizeOnLoad ? handleOnBeforeOpen : undefined}
      onOpen={sizeOnLoad ? handleOnOpen : undefined}
    >
      {children}
    </Gallery>
  )
}

export default LightboxGallery
