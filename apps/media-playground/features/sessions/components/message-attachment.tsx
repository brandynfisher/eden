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
}

export const MessageAttachment: FC<MessageAttachmentProps> = ({
  url,
  index,
  className,
}) => {
  const mediaType = getSuspectedMediaType(url)

  return (
    <div
      className={cn([
        'relative rounded-lg border border-border overflow-hidden',
        className,
      ])}
    >
      {mediaType === 'image' ||
      mediaType === 'video' ||
      mediaType === 'audio' ? (
        <LightboxTrigger
          startIndex={index}
          className="block"
          slide={{
            type: mediaType,
            duration: mediaType === 'video' ? 0 : undefined,
            url: mediaType === 'audio' ? url : getCloudfrontOriginalUrl(url),
          }}
          imageProps={{
            className:
              'max-w-xs max-h-32 w-auto h-auto object-contain rounded-lg',
            unoptimized: true,
            loading: 'lazy',
          }}
          videoProps={{
            className:
              'max-w-xs max-h-32 w-auto h-auto object-contain rounded-lg',
          }}
        />
      ) : (
        <div className="w-32 h-20 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
          <div className="text-xs font-medium">
            {url.split('.').pop()?.toUpperCase() || 'FILE'}
          </div>
        </div>
      )}
    </div>
  )
}
