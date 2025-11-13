import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/styles.css'

import { MediaDurationBadge } from '@/components/badge/media-duration-badge'
import { useBlurDataUrl } from '@/hooks/use-blur-hash'
import { useHover } from '@/hooks/use-hover'
import customImageLoader from '@/image-loader'
import { siteConfig } from '@/lib/config'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { AudioLinesIcon, PauseIcon, PlayIcon } from 'lucide-react'
import NextImage, { ImageProps } from 'next/image'
import React from 'react'
import { ReactNode, createContext, useContext, useState } from 'react'
import Lightbox, { Slide } from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Download from 'yet-another-react-lightbox/plugins/download'
import Video from 'yet-another-react-lightbox/plugins/video'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

// Context type and creation
type LightboxContextType = {
  open: boolean
  startIndex: number
  setOpen: (open: boolean) => void
  setStartIndex: (index: number) => void
  addSlide: (slide: Slide) => void
  setSlides: (updater: (slides: Slide[]) => Slide[]) => void
  galleryKey?: string | number
}

const LightboxContext = createContext<LightboxContextType | undefined>(
  undefined,
)

// Hook for using the context
export function useLightbox() {
  const context = useContext(LightboxContext)
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider')
  }
  return context
}

// Global map to store slides for each gallery instance
const gallerySlidesMap = new Map<string | number, Slide[]>()

export type LightboxGallerySlide = {
  url: string
  thumbnail?: string
  width?: number
  height?: number
  duration?: number
  title?: string
  description?: string
  type?: 'image' | 'video' | 'audio'
}

// Audio Component for Lightbox
const AudioComponent = React.forwardRef<
  HTMLAudioElement,
  {
    src: string
    autoPlay?: boolean
    ref?: React.Ref<HTMLAudioElement>
  }
>((props, ref) => {
  return (
    <div className="audio-component flex flex-col items-center justify-center w-full h-full bg-background/80 backdrop-blur-sm">
      <AudioLinesIcon className="w-24 h-24 mb-4 text-muted-foreground" />
      <audio
        ref={ref}
        controls
        loop
        autoPlay={props.autoPlay}
        className="w-full max-w-md"
        src={props.src}
      />
    </div>
  )
})
AudioComponent.displayName = 'AudioComponent'

// Main Lightbox Gallery component
export type LightboxGalleryProps = {
  children?: ReactNode
  enableDownload?: boolean
  startIndex?: number
  galleryKey?: string | number
}

export const LightboxGallery = ({
  children,
  enableDownload = false,
  galleryKey,
}: LightboxGalleryProps) => {
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])

  // Clear slides when component unmounts or key changes
  React.useEffect(() => {
    if (galleryKey) {
      // Initialize slides from the map if they exist
      const existingSlides = gallerySlidesMap.get(galleryKey)
      if (existingSlides) {
        setSlides(existingSlides)
      } else {
        setSlides([])
      }
    }

    return () => {
      if (galleryKey) {
        // Clear slides for this gallery key when unmounting
        gallerySlidesMap.delete(galleryKey)
      }
    }
  }, [galleryKey])

  const addSlide = React.useCallback(
    (slide: Slide) => {
      setSlides(prev => {
        if (!prev.some(s => JSON.stringify(s) === JSON.stringify(slide))) {
          const newSlides = [...prev, slide]
          if (galleryKey) {
            gallerySlidesMap.set(galleryKey, newSlides)
          }
          return newSlides
        }
        return prev
      })
    },
    [galleryKey],
  )

  const setGallerySlides = React.useCallback(
    (updater: (slides: Slide[]) => Slide[]) => {
      setSlides(prev => {
        const newSlides = updater(prev)
        if (galleryKey) {
          gallerySlidesMap.set(galleryKey, newSlides)
        }
        return newSlides
      })
    },
    [galleryKey],
  )

  const plugins = [
    Captions,
    Counter,
    Zoom,
    Video,
    ...(enableDownload ? [Download] : []),
  ]
  const hasSingleSlide = slides.length <= 1
  return (
    <LightboxContext.Provider
      value={{
        open,
        setOpen,
        startIndex,
        setStartIndex,
        addSlide,
        setSlides: setGallerySlides,
        galleryKey,
      }}
    >
      {children}
      <Lightbox
        plugins={plugins}
        zoom={{
          maxZoomPixelRatio: 12,
          scrollToZoom: true,
        }}
        captions={{
          showToggle: true,
          descriptionMaxLines: 2,
          hidden: true,
        }}
        // counter={{ container: { style: { top: 'unset', bottom: 80 } } }}
        open={open}
        index={startIndex}
        close={() => setOpen(false)}
        slides={slides}
        carousel={{
          finite: hasSingleSlide,
        }}
        controller={{ closeOnBackdropClick: true }}
        on={{
          view: props => {
            // Handle both audio and video elements
            const audios = document.querySelectorAll(
              '.audio-component audio',
            ) as NodeListOf<HTMLAudioElement>

            // Handle audio elements
            audios.forEach(audio => {
              const currentSlide = slides[props.index]
              if (!currentSlide || !('src' in currentSlide)) {
                audio.pause()
                audio.currentTime = 0
                return
              }
              if (audio.src === currentSlide.src) {
                audio.play().catch(() => {
                  // Handle autoplay policy errors silently
                })
                audio.currentTime = 0
              } else {
                audio.pause()
                audio.currentTime = 0
              }
            })
          },
          entered: () => {
            window.dispatchEvent(new Event(`lightbox-open`))
          },
          exiting: () => {
            // Prevent Escape key from bubbling to parent modals
            // Add a small flag to indicate lightbox is closing
            window.dispatchEvent(new Event(`lightbox-closing`))
          },
          exited: () => {
            window.dispatchEvent(new Event(`lightbox-close`))
          },
        }}
        render={{
          buttonPrev: slides.length === 1 ? () => null : undefined,
          buttonNext: slides.length === 1 ? () => null : undefined,
          slide: props => {
            // @ts-expect-error slide.src is not always defined
            if (props.slide.type === 'audio') {
              return (
                <AudioComponent
                  // @ts-expect-error slide.src is not always defined
                  src={props.slide.src}
                  autoPlay={props.offset === 0}
                />
              )
            }
            return null
          },
        }}
      />
    </LightboxContext.Provider>
  )
}

type LightboxTriggerProps = {
  className?: string
  startIndex?: number
  slide?: LightboxGallerySlide
  videoProps?: LightboxVideoTriggerProps
  imageProps?: LightboxImageTriggerProps
}

export const LightboxTrigger = React.forwardRef<
  HTMLDivElement,
  LightboxTriggerProps
>(({ className, slide, startIndex, videoProps, imageProps }, ref) => {
  const { setOpen, setStartIndex, addSlide } = useLightbox()

  React.useEffect(() => {
    if (!slide) return

    if (slide.type === 'audio') {
      addSlide({
        // @ts-expect-error slide.type is not always defined
        type: 'audio',
        src: slide.url,
        autoPlay: true,
      })
    } else if (slide.url?.endsWith('.mp4')) {
      addSlide({
        type: 'video',
        width: slide.width,
        height: slide.height,
        poster: slide.thumbnail?.endsWith('.mp4')
          ? slide.thumbnail.replace('.mp4', '_1024.webp')
          : slide.thumbnail,
        autoPlay: true,
        sources: [
          {
            src: getCloudfrontUrl(slide.url) || '',
            type: 'video/mp4',
          },
        ],
        description: slide.description,
      })
    } else {
      addSlide({
        type: 'image',
        width: slide.width,
        height: slide.height,
        src: slide.url,
        description: slide.description,
      })
    }
  }, [slide, addSlide])

  if (!slide) return null

  return (
    <div
      ref={ref}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', slide.url || '')
      }}
      className={cn(
        'rounded-md overflow-hidden cursor-zoom-in w-full h-full',
        className,
      )}
      onClick={() => {
        setStartIndex(startIndex ?? 0)
        setOpen(true)
      }}
    >
      {slide.type === 'audio' ? (
        <LightboxAudioTrigger src={slide.url} duration={slide.duration} />
      ) : slide.url?.endsWith('.mp4') ? (
        <LightboxVideoTrigger
          src={slide.url}
          thumbnail={slide.thumbnail}
          duration={slide.duration}
          width={slide.width}
          height={slide.height}
          {...videoProps}
        />
      ) : (
        <LightboxImageTrigger
          src={slide.url}
          lowResSrc={slide.thumbnail}
          width={slide.width}
          height={slide.height}
          {...imageProps}
        />
      )}
    </div>
  )
})
LightboxTrigger.displayName = 'LightboxTrigger'

// Image Trigger Component
type LightboxImageTriggerProps = {
  src?: string
  lowResSrc?: string
  alt?: string
  blurhash?: string
  loading?: 'eager' | 'lazy'
  customLoader?: boolean
} & Omit<ImageProps, 'src' | 'alt'>

export function LightboxImageTrigger({
  src = siteConfig.mediaErrorUrl,
  lowResSrc,
  alt = '',
  blurhash,
  className,
  loading,
  customLoader,
  ...props
}: LightboxImageTriggerProps) {
  const { width: ignoredWidth, height: ignoredHeight, ...restProps } = props
  const width = typeof ignoredWidth === 'number' ? ignoredWidth : 1024
  const height = typeof ignoredHeight === 'number' ? ignoredHeight : 1024
  const blurDataUrl = useBlurDataUrl(blurhash, width, height)
  const [isHighResLoaded, setIsHighResLoaded] = React.useState(false)

  React.useEffect(() => {
    setIsHighResLoaded(false)
  }, [src])

  const placeholderSrc = lowResSrc || blurDataUrl || undefined
  const showPlaceholder = Boolean(placeholderSrc)

  return (
    <div
      className={cn('relative w-full', className)}
      style={
        height && width ? { aspectRatio: `${width}/${height}` } : undefined
      }
    >
      <div className="absolute inset-0">
        {showPlaceholder ? (
          <img
            src={placeholderSrc}
            alt={alt}
            className={cn(
              'absolute inset-0 object-contain w-full h-full bg-muted/10 pointer-events-none',
              isHighResLoaded ? 'opacity-0' : 'opacity-100',
            )}
            draggable={false}
          />
        ) : null}
        <NextImage
          loader={!customLoader ? undefined : customImageLoader}
          src={src}
          alt={alt}
          className={cn(
            'absolute inset-0 object-contain w-full h-full !bg-contain',
            isHighResLoaded ? 'opacity-100' : 'opacity-0',
          )}
          fill
          sizes="100vw"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
          blurDataURL={!lowResSrc ? blurDataUrl : undefined}
          placeholder={!lowResSrc && blurDataUrl ? 'blur' : undefined}
          loading={loading ?? 'eager'}
          onLoad={() => {
            setIsHighResLoaded(true)
          }}
          {...restProps}
        />
      </div>
    </div>
  )
}

// Video Trigger Component
type LightboxVideoTriggerProps = {
  thumbnail?: string
  duration?: number | null
} & React.VideoHTMLAttributes<HTMLVideoElement>

export function LightboxVideoTrigger({
  src,
  thumbnail,
  className,
  duration,
  ...props
}: LightboxVideoTriggerProps) {
  const { hovered, ref: hoverRef } = useHover()
  const width = props?.width ? +props.width : 1024
  const height = props?.height ? +props.height : 1024
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Handle play/pause with error catching
  const handlePlay = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.play()
      }
    } catch (error) {
      // Silently handle abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Video playback error:', error)
      }
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div ref={hoverRef} className={cn('relative h-full w-full', className)}>
      {thumbnail && (
        <LightboxImageTrigger
          customLoader={true}
          src={
            thumbnail?.endsWith('.mp4')
              ? thumbnail.replace('.mp4', '_1024.webp')
              : thumbnail
          }
          width={width}
          height={height}
          // priority={true}
          className={cn(
            'absolute inset-0 flex w-full h-full object-contain bg-muted/10',
            className,
          )}
        />
      )}
      {typeof duration === 'number' && !hovered ? (
        <MediaDurationBadge duration={duration} isLoading={false} />
      ) : null}
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        width={width}
        height={height}
        className={cn(
          'flex w-full h-full object-contain relative z-10',
          className,
        )}
        onMouseEnter={handlePlay}
        onMouseLeave={handlePause}
        {...props}
      />
    </div>
  )
}

// Audio Trigger Component
type LightboxAudioTriggerProps = {
  src?: string
  duration?: number | null
  autoPlay?: boolean
}

export function LightboxAudioTrigger({
  src,
  duration,
}: LightboxAudioTriggerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening lightbox when toggling play

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Handle audio end event
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-muted/30 rounded-md">
      <audio ref={audioRef} src={src} className="hidden" />

      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <AudioLinesIcon className="w-8 h-8 text-muted-foreground" />

        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5 text-primary" />
          ) : (
            <PlayIcon className="w-5 h-5 text-primary ml-0.5" />
          )}
        </button>

        {typeof duration === 'number' && (
          <span className="text-xs text-muted-foreground font-medium">
            {formatDuration(duration)}
          </span>
        )}
      </div>
    </div>
  )
}
