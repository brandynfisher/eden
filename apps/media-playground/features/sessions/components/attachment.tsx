'use client'

import LoadingIndicator from '@/components/loading-indicator'
import { LightboxTrigger, useLightbox } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { CancelTokenSource } from 'axios'
import { CircleXIcon } from 'lucide-react'
import React, { FC, useEffect } from 'react'
import type { Slide } from 'yet-another-react-lightbox'

export type FileUploadProgress = {
  id: string
  file: File
  progress: number
  source: CancelTokenSource | null
  status: 'uploading' | 'complete' | 'error'
}

type AttachmentProps = {
  attachment: FileUploadProgress
  onRemove?: () => void
  index: number
}

export const Attachment: FC<AttachmentProps> = ({
  attachment,
  onRemove,
  index,
}) => {
  const { setSlides } = useLightbox()

  // Get the file URL and media type
  const fileUrl = (attachment.file as File & { fileUrl?: string }).fileUrl || ''
  const mediaType = getSuspectedMediaType(fileUrl || attachment.file.name)

  // Clean up lightbox slides when attachment is removed
  useEffect(() => {
    return () => {
      if (onRemove) {
        setSlides((prev: Slide[]) =>
          prev.filter((_, idx: number) => idx !== index),
        )
      }
    }
  }, [index, onRemove, setSlides])

  return (
    <div
      draggable
      onDragStart={e => {
        const url =
          mediaType === 'audio' ? fileUrl : getCloudfrontOriginalUrl(fileUrl)

        e.dataTransfer.setData('text/plain', '') // Required for Firefox
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({
            fileUrl: url,
            type: attachment.file.type || 'image/jpeg',
            name: url,
          }),
        )
        e.dataTransfer.effectAllowed = 'copy'
      }}
      className={cn([
        'relative rounded-md border border-secondary cursor-pointer hover:bg-accent',
      ])}
    >
      {attachment.status === 'uploading' && (
        <div
          className="absolute inset-0 flex flex-col justify-center rounded-md bg-background/70 w-full h-full overflow-hidden"
          key={`progress-${attachment.id}`}
        >
          <LoadingIndicator className="absolute w-10 h-10 text-purple-600 self-center" />
          <Progress
            max={100}
            value={Math.round(attachment.progress * 100)}
            className="h-1 rounded-none mt-auto"
          />
        </div>
      )}
      <div className="p-0.5 flex gap-1 h-full">
        {fileUrl &&
        attachment.status === 'complete' &&
        (mediaType === 'image' ||
          mediaType === 'video' ||
          mediaType === 'audio') ? (
          <LightboxTrigger
            startIndex={index}
            className="flex items-center justify-center z-0"
            slide={{
              type: mediaType,
              duration: mediaType === 'video' ? 0 : undefined,
              url:
                mediaType === 'audio'
                  ? fileUrl
                  : getCloudfrontOriginalUrl(fileUrl),
            }}
            imageProps={{
              className: 'object-cover flex-shrink-0 max-w-24 h-16',
              unoptimized: true,
              loading: 'lazy',
            }}
            videoProps={{
              className: 'object-cover flex-shrink-0 max-w-24 h-16',
            }}
          />
        ) : (
          <div className="w-16 h-16 text-xs flex items-center justify-center text-muted-foreground">
            {attachment.file.name.split('.').pop()?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      {onRemove && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-[-8px] right-[-8px] h-8 w-8"
                onClick={onRemove}
              >
                <CircleXIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
