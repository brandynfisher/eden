'use client'

import { ATTACHMENT_UPDATE_EVENT } from '../eden-image-attachment-adapter'
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
} from '@assistant-ui/react'
import { useThreadConfig } from '@assistant-ui/react-ui'
import { PendingAttachmentStatus } from '@assistant-ui/react/dist/types/AttachmentTypes'
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
      if (a.file) {
        // Check if the file has a fileUrl property
        const fileWithUrl = a.file as File & { fileUrl?: string }
        if (fileWithUrl.fileUrl) {
          return { file: a.file, src: fileWithUrl.fileUrl }
        }
        return { file: a.file }
      }
      const imageContentPart = a.content?.filter(
        c => c.type === 'image',
      )[0] as ImageContentPart
      const src = imageContentPart?.image
      if (!src) return {}
      return { src }
    }),
  )

  // Get object URL from file
  const objectUrl = useFileSrc(file)

  // Log the sources for debugging
  console.log('useAttachmentSrc sources:', {
    objectUrl,
    src,
    fileUrl: file ? (file as File & { fileUrl?: string }).fileUrl : undefined,
  })

  // Return the first available source
  return (
    objectUrl ||
    src ||
    (file ? (file as File & { fileUrl?: string }).fileUrl : undefined)
  )
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
  const attachment = useAttachment()
  const { setSlides } = useLightbox()

  // Track progress state locally to ensure UI updates
  const [localProgress, setLocalProgress] = useState(0)

  // const uploadProgress = useAttachment(a => {
  //   // Log the entire attachment object for debugging
  //   console.log('useAttachment status:', a.id, a.name, a.status);

  //   // Handle different status types
  //   if (a.status.type === 'running') {
  //     // Use type assertion to safely access progress
  //     const runningStatus = a.status as { type: 'running', reason: string, progress: number };

  //     // Ensure progress is a number between 0 and 1
  //     let progress = typeof runningStatus.progress === 'number' ? runningStatus.progress : 0;

  //     // Clamp progress between 0 and 1
  //     progress = Math.max(0, Math.min(1, progress));

  //     // Log the extracted progress value
  //     console.log(`Progress value for ${a.name}: ${progress} (${Math.round(progress * 100)}%)`);

  //     // Update local progress state
  //     return progress;
  //   }
  //   if (a.status.type === 'complete') {
  //     console.log(`Complete status for ${a.name}, returning progress 1`);
  //     return 1;
  //   }

  //   console.log(`Unknown status type for ${a.name}: ${a.status.type}, returning progress 0`);
  //   return 0; // Default to 0 progress for other status types
  // })

  // Update local progress when uploadProgress changes
  // useEffect(() => {
  //   console.log(`Setting local progress to ${uploadProgress} for ${attachment.name}`);
  //   setLocalProgress(uploadProgress);
  // }, [uploadProgress, attachment.name]);

  const src = useAttachmentSrc()

  // Force a re-render when the attachment status changes
  const [timestamp, setTimestamp] = useState(Date.now())
  const forceUpdate = () => {
    console.log(
      `Forcing update for attachment: ${
        attachment.id
      } at ${new Date().toISOString()}`,
    )
    setTimestamp(Date.now())
  }

  // Listen for attachment update events
  useEffect(() => {
    if (
      attachment.file &&
      (attachment.file as File & { isPreUploaded?: boolean }).isPreUploaded
    ) {
      setLocalProgress(1)
      forceUpdate()
      return
    }
    const handleAttachmentUpdate = (
      event: CustomEvent<{
        attachmentId: string
        status: PendingAttachmentStatus
      }>,
    ) => {
      if (event.detail.attachmentId === attachment.id) {
        console.log(
          `Received update event for attachment: ${attachment.id}`,
          event,
          attachment,
        )
        // For running status, use the progress value
        if (event.detail.status.type === 'running') {
          setLocalProgress(event.detail.status.progress)
        } else {
          // For other status types, set progress to 0
          setLocalProgress(0)
        }
        // Force a re-render
        forceUpdate()
      }
    }

    // Add event listener
    window.addEventListener(
      ATTACHMENT_UPDATE_EVENT,
      handleAttachmentUpdate as EventListener,
    )

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener(
        ATTACHMENT_UPDATE_EVENT,
        handleAttachmentUpdate as EventListener,
      )
    }
  }, [attachment.id])

  const attachments = useComposer(s => s.attachments)
  const attachmentIndex = canRemove
    ? attachments.findIndex(a => a.id === attachment.id)
    : Number(attachment.id)

  // Safely access fileUrl with type checking
  const fileUrl = attachment.file
    ? (attachment.file as File & { fileUrl?: string }).fileUrl || ''
    : attachment.name

  console.log('fileUrl', fileUrl, attachment)
  const mediaType = attachment.file
    ? getSuspectedMediaType(
        (attachment.file as File & { fileUrl?: string }).fileUrl ||
          attachment.name,
      )
    : getSuspectedMediaType(attachment.name)

  console.log('mediaType', mediaType)
  console.log(
    'imgsrc',
    attachment.file
      ? (attachment.file as File & { fileUrl?: string }).fileUrl
      : null,
  )
  const mediaSrc = attachment.file
    ? (attachment.file as File & { fileUrl?: string }).fileUrl
    : attachment.name

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

  const componentKey = `${attachment.id}-${attachment.status?.type}-${fileUrl}`

  // Log component render
  console.log(
    `Rendering attachment: ${attachment.id} with status: ${
      attachment.status?.type
    } at ${new Date().toISOString()}`,
  )

  return (
    <AttachmentPrimitive.Root
      key={componentKey}
      draggable
      onDragStart={e => {
        console.log('onDragStart', { mediaSrc, src, canRemove, attachment, e })
        const url = canRemove
          ? mediaType === 'audio'
            ? mediaSrc
            : getCloudfrontOriginalUrl(mediaSrc)
          : src ?? siteConfig.mediaErrorUrl

        e.dataTransfer.setData('text/plain', '') // Required for Firefox
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({
            fileUrl: url,
            type: attachment.contentType || 'image/jpeg',
            name: url, // Use the full URL as the name
          }),
        )
        e.dataTransfer.effectAllowed = 'copy'
      }}
      className={cn([
        'relative rounded-md border border-secondary cursor-pointer ',
        canRemove ? ' mt-2 hover:bg-accent' : 'w-auto items-center',
        // Add a green border for complete uploads
      ])}
    >
      {canRemove && localProgress !== 1 ? (
        <div
          className="absolute inset-0 flex flex-col justify-center rounded-md bg-background/70 w-full h-full overflow-hidden"
          key={`progress-${attachment.id}`}
        >
          <LoadingIndicator className="absolute w-10 h-10 text-purple-600 self-center" />
          <Progress
            max={100}
            value={Math.round(localProgress * 100)}
            className="h-1 rounded-none mt-auto"
          />
        </div>
      ) : null}
      <div
        className={cn([
          'p-1 flex gap-1 h-full ',
          canRemove ? 'p-0.5' : 'max-h-48 items-center',
        ])}
      >
        {mediaSrc &&
        (localProgress === 1 || !canRemove) &&
        (mediaType === 'image' ||
          mediaType === 'video' ||
          mediaType === 'audio') ? (
          <LightboxTrigger
            key={`${attachment.id}-${attachment.status?.type}-${fileUrl}-${timestamp}`}
            startIndex={attachmentIndex}
            className="flex items-center justify-center z-0"
            slide={{
              type: mediaType,
              duration: mediaType === 'video' ? 0 : undefined,
              url: canRemove
                ? mediaType === 'audio'
                  ? mediaSrc
                  : getCloudfrontOriginalUrl(mediaSrc)
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
        ) : (
          <div className="w-16 h-16 flex items-center justify-center text-muted-foreground">
            {attachment.name.split('.').pop()?.toUpperCase() || 'FILE'}
          </div>
        )}
      </div>
      {canRemove && <AttachmentRemove />}
    </AttachmentPrimitive.Root>
  )
}

export default MyAttachment
