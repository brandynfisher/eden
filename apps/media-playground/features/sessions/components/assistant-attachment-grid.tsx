'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import React, { useState } from 'react'

interface AssistantAttachmentGridProps {
  attachments: string[]
  messageId: string
  className?: string
}

/**
 * Single image wrapper that detects aspect ratio for smart sizing.
 * Portrait images are height-constrained, landscape images are width-constrained.
 */
const SingleImageWrapper = ({
  url,
  mediaType,
}: {
  url: string
  mediaType: 'image' | 'video'
}) => {
  const [isPortrait, setIsPortrait] = useState(false)

  return (
    <div
      className={cn(
        isPortrait
          ? 'max-h-[40vh]' // Portrait: constrain height
          : 'max-w-full sm:max-w-[80%] md:max-w-[600px]', // Landscape: constrain width
      )}
    >
      <LightboxTrigger
        startIndex={0}
        slide={{
          type: mediaType,
          url: getCloudfrontOriginalUrl(url),
          duration: mediaType === 'video' ? 0 : undefined,
        }}
        imageProps={{
          className: 'rounded-lg w-full h-auto',
          unoptimized: true,
          loading: 'lazy',
          onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget
            setIsPortrait(img.naturalHeight > img.naturalWidth * 1.2)
          },
        }}
        videoProps={{
          className: 'rounded-lg w-full h-auto',
        }}
      />
    </div>
  )
}

/**
 * Grid image tile that uses flex-grow based on aspect ratio.
 */
const GridImageTile = ({
  url,
  mediaType,
  index,
  rowHeight,
}: {
  url: string
  mediaType: 'image' | 'video'
  index: number
  rowHeight: number
}) => {
  const [aspectRatio, setAspectRatio] = useState(1)

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        flexGrow: aspectRatio,
        flexBasis: 0,
        minWidth: '30%',
        height: rowHeight,
      }}
    >
      <LightboxTrigger
        startIndex={index}
        className="w-full h-full"
        slide={{
          type: mediaType,
          url: getCloudfrontOriginalUrl(url),
          duration: mediaType === 'video' ? 0 : undefined,
        }}
        imageProps={{
          className: 'w-full h-full object-cover rounded-lg',
          unoptimized: true,
          loading: 'lazy',
          onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget
            const ratio = img.naturalWidth / img.naturalHeight
            setAspectRatio(ratio)
          },
        }}
        videoProps={{
          className: 'w-full h-full object-cover rounded-lg',
        }}
      />
    </div>
  )
}

/**
 * Attachment display for assistant/agent messages.
 * - Single images: natural aspect ratio with sensible constraints
 * - Multiple images: flex grid with aspect-ratio-based width distribution
 */
export const AssistantAttachmentGrid = ({
  attachments,
  messageId,
  className,
}: AssistantAttachmentGridProps) => {
  const count = attachments.length

  if (count === 0) return null

  // Filter to only media
  const mediaAttachments = attachments.filter(url => {
    const type = getSuspectedMediaType(url)
    return type === 'image' || type === 'video'
  })

  const nonMediaAttachments = attachments.filter(url => {
    const type = getSuspectedMediaType(url)
    return type !== 'image' && type !== 'video'
  })

  // No media - just show file badges
  if (mediaAttachments.length === 0) {
    return (
      <div className={cn('mt-4 flex flex-wrap gap-2', className)}>
        {nonMediaAttachments.map(url => (
          <FileTypeBadge key={url} url={url} />
        ))}
      </div>
    )
  }

  // Single image - natural display with smart constraints
  if (mediaAttachments.length === 1) {
    const url = mediaAttachments[0]
    const mediaType = getSuspectedMediaType(url) as 'image' | 'video'

    return (
      <LightboxGallery galleryKey={messageId}>
        <div className={cn('mt-4 flex justify-center', className)}>
          <SingleImageWrapper url={url} mediaType={mediaType} />
        </div>
        {nonMediaAttachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {nonMediaAttachments.map(u => (
              <FileTypeBadge key={u} url={u} />
            ))}
          </div>
        )}
      </LightboxGallery>
    )
  }

  // Multiple images - flex grid with aspect-ratio-based sizing
  const rowHeight =
    mediaAttachments.length <= 2
      ? 280
      : mediaAttachments.length <= 4
      ? 220
      : 180

  return (
    <LightboxGallery galleryKey={messageId}>
      <div className={cn('mt-4', className)}>
        <div className="flex flex-wrap gap-1">
          {mediaAttachments.map((url, index) => {
            const mediaType = getSuspectedMediaType(url) as 'image' | 'video'
            return (
              <GridImageTile
                key={url}
                url={url}
                mediaType={mediaType}
                index={index}
                rowHeight={rowHeight}
              />
            )
          })}
        </div>
        {nonMediaAttachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {nonMediaAttachments.map(u => (
              <FileTypeBadge key={u} url={u} />
            ))}
          </div>
        )}
      </div>
    </LightboxGallery>
  )
}

/**
 * Badge for non-media file types
 */
const FileTypeBadge = ({ url }: { url: string }) => {
  const extension = (() => {
    try {
      const pathname = new URL(url).pathname
      return pathname.split('.').pop()?.toUpperCase() || 'FILE'
    } catch {
      return url.split('?')[0].split('.').pop()?.toUpperCase() || 'FILE'
    }
  })()

  return (
    <div className="w-24 h-20 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg border border-border/50">
      <span className="text-xs font-medium tracking-wide">{extension}</span>
    </div>
  )
}
