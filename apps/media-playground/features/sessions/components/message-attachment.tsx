'use client'

import { LightboxTrigger } from '@/components/media/lightbox'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import React, { FC } from 'react'

type MessageAttachmentProps = {
  url: string
  index: number
  className?: string
  /** Size variant for the attachment */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
}

export const MessageAttachment: FC<MessageAttachmentProps> = ({
  url,
  index,
  className,
  size = 'md',
}) => {
  const mediaType = getSuspectedMediaType(url)

  return (
    <div
      className={cn([
        'relative rounded-lg border border-border overflow-hidden',
        sizeClasses[size],
        className,
      ])}
    >
      {mediaType === 'image' ||
      mediaType === 'video' ||
      mediaType === 'audio' ? (
        <LightboxTrigger
          startIndex={index}
          className="block w-full h-full"
          slide={{
            type: mediaType,
            duration: mediaType === 'video' ? 0 : undefined,
            url: mediaType === 'audio' ? url : getCloudfrontOriginalUrl(url),
          }}
          imageProps={{
            className: 'w-full h-full object-cover rounded-lg',
            unoptimized: true,
            loading: 'lazy',
          }}
          videoProps={{
            className: 'w-full h-full object-cover rounded-lg',
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
          <div className="text-xs font-medium">
            {(() => {
              try {
                const pathname = new URL(url).pathname
                return pathname.split('.').pop()?.toUpperCase() || 'FILE'
              } catch {
                return (
                  url.split('?')[0].split('.').pop()?.toUpperCase() || 'FILE'
                )
              }
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
