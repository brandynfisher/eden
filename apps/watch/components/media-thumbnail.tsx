'use client'

import { useMediaPrefetch } from '@/hooks/use-media-prefetch'
import { cn, getProxiedUrl } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MediaThumbnailProps {
  item: CreationV2
  className?: string
  width?: number
  height?: number
  onClick?: () => void
  priority?: boolean
}

/**
 * A reusable thumbnail component for displaying collection items
 * with built-in prefetching capabilities
 */
export function MediaThumbnail({
  item,
  className,
  width,
  height,
  onClick,
  priority = false,
}: MediaThumbnailProps) {
  const { prefetch } = useMediaPrefetch()
  const [isLoaded, setIsLoaded] = useState(false)

  const isVideo = item.mediaAttributes?.mimeType?.startsWith('video')

  // Get the appropriate URL (proxied for videos)
  const mediaUrl = item.url
    ? getProxiedUrl(item.url, item.mediaAttributes?.mimeType)
    : ''

  // Prefetch the item when the component mounts
  useEffect(() => {
    if (item.url) {
      prefetch(item.url, item.mediaAttributes?.mimeType, {
        // For priority items, prefetch video data more aggressively
        prefetchVideoData: priority && isVideo,
      })
    }
  }, [item.url, item.mediaAttributes?.mimeType, prefetch, priority, isVideo])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ width, height }}
      onClick={onClick}
    >
      {/* Media thumbnail */}
      <img
        src={mediaUrl}
        alt={item.filename || 'Media thumbnail'}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          !isLoaded && 'opacity-0',
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
      />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        </div>
      )}

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="size-10 text-white opacity-80" />
        </div>
      )}
    </div>
  )
}
