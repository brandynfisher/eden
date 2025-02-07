'use client'

import { getSuspectedMediaType } from '../utils/files'
import LoadingIndicator from '@/components/loading-indicator'
import { LightboxTrigger, useLightbox } from '@/components/media/lightbox'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { Progress } from '@/components/ui/progress'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  AttachmentPrimitive,
  ImageContentPart,
  useAttachment,
  useComposer,
  useThreadConfig,
} from '@assistant-ui/react'
import { CircleXIcon } from 'lucide-react'
import React, { FC, useEffect, useState } from 'react'
import type { Slide } from 'yet-another-react-lightbox'
import { useShallow } from 'zustand/shallow'

const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!file) {
      setSrc(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSrc(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return src
}

const useAttachmentSrc = () => {
  const { file, src } = useAttachment(
    useShallow((a): { file?: File; src?: string } => {
      if (a.type !== 'image') return {}
      if (a.file) return { file: a.file }
      const imageContentPart = a.content?.filter(
        c => c.type === 'image',
      )[0] as ImageContentPart
      const src = imageContentPart?.image
      if (!src) return {}
      return { src }
    }),
  )

  return useFileSrc(file) ?? src
}

const AttachmentRemove: FC = () => {
  const {
    strings: {
      composer: { removeAttachment: { tooltip = 'Remove file' } = {} } = {},
    } = {},
  } = useThreadConfig()

  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip={tooltip}
        side="top"
        className="absolute top-[-8px] right-[-8px]"
      >
        <CircleXIcon />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
  )
}

const MyAttachment: FC = () => {
  const canRemove = useAttachment(a => a.source !== 'message')
  const uploadProgress = useAttachment(a =>
    a.status.type === 'running' ? a.status.progress : 1,
  )
  const attachment = useAttachment()
  const { setSlides } = useLightbox()

  // @ts-expect-error attachment.file is not always defined
  const fileUrl = attachment.file ? attachment.file.fileUrl : attachment.name
  const src = useAttachmentSrc()

  const attachments = useComposer(s => s.attachments)
  const attachmentIndex = canRemove
    ? attachments.findIndex(a => a.id === attachment.id)
    : Number(attachment.id)

  const mediaType = getSuspectedMediaType(fileUrl)

  useEffect(() => {
    return () => {
      if (canRemove) {
        // Clear this slide from lightbox when attachment is removed
        setSlides((prev: Slide[]) =>
          prev.filter((_, idx: number) => idx !== attachmentIndex),
        )
      }
    }
  }, [canRemove, attachmentIndex, setSlides])

  return (
    <AttachmentPrimitive.Root
      className={cn([
        'relative rounded-md border border-secondary cursor-pointer ',
        canRemove ? ' mt-2 hover:bg-accent' : 'w-auto items-center',
      ])}
    >
      {uploadProgress !== 1 ? (
        <div className="absolute rounded-md bg-background/40 w-full h-full overflow-hidden">
          <LoadingIndicator className="w-full h-full p-1.5" />
          <Progress
            max={1}
            value={uploadProgress}
            className="h-1 bottom-0.5 rounded-none bg-transparent"
          />
        </div>
      ) : null}
      <div
        className={cn([
          'p-1 flex gap-1 h-full ',
          canRemove ? 'p-0.5' : 'max-h-48 items-center',
        ])}
      >
        {mediaType === 'image' || mediaType === 'video' ? (
          <LightboxTrigger
            startIndex={attachmentIndex}
            className="flex items-center justify-center z-0"
            slide={{
              duration: mediaType === 'video' ? 0 : undefined,
              url: canRemove
                ? getCloudfrontOriginalUrl(fileUrl)
                : src ?? siteConfig.mediaErrorUrl,
            }}
            imageProps={{
              className: canRemove
                ? 'object-cover flex-shrink-0 max-w-24 h-16'
                : 'object-contain w-full max-h-64 max-w-64 flex-shrink-0',
              unoptimized: true,
              loading: 'lazy',
            }}
            videoProps={{
              className: canRemove
                ? 'object-cover flex-shrink-0 max-w-24 h-16'
                : 'object-contain w-full max-h-64 max-w-64 flex-shrink-0',
            }}
          />
        ) : mediaType === 'audio' ? (
          <audio src={fileUrl} controls loop={true} className="block" />
        ) : (
          'n/a'
        )}
      </div>
      {canRemove && <AttachmentRemove />}
    </AttachmentPrimitive.Root>
  )
}

export default MyAttachment
