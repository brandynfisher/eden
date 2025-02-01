'use client'

import { useEdenRuntimeExtras } from '../hooks/useEdenRuntime'
import { LightboxGallery } from '@/components/media/lightbox'
import MyAttachment from '@/features/chat/components/attachment'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { fileMatchesAccept } from '@/features/chat/utils/files'
import { cn } from '@/lib/utils'
import {
  Composer,
  ThreadPrimitive,
  useComposerRuntime,
} from '@assistant-ui/react'
import { BotIcon, PencilOffIcon } from 'lucide-react'
import React, { FC, useState } from 'react'
import { toast } from 'sonner'

type ComposerAttachmentDropzoneProps = {
  isDragging: boolean
  accept: string
}

export const ComposerAttachmentDropzone: FC<
  ComposerAttachmentDropzoneProps
> = ({ isDragging, accept }) => {
  return (
    <div
      className={cn([
        'absolute w-full opacity-0 h-full z-10 left-0 pointer-events-none bg-muted/50 border border-purple-600 rounded-md overflow-hidden',
        isDragging ? 'opacity-100' : '',
      ])}
    >
      {isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm text-purple-600">Drop attachments here</p>
          <div className="text-xs text-muted-foreground">
            Accepted: <span className="font-semibold">{accept}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const MyComposer: FC = () => {
  const isReadOnly = useEdenRuntimeExtras(extras => extras.isReadOnly)
  const [isDragging, setIsDragging] = useState(false)
  const composerRuntime = useComposerRuntime()
  // console.log('isReadOnly', composerRuntime.getState())
  const accept = composerRuntime.getAttachmentAccept()

  const handleFilesDropped = async (files: File[]) => {
    // accept contains mimetypes with wildcards like image/*, allow only these
    const acceptedFiles = files.filter(file => fileMatchesAccept(file, accept))

    if (!acceptedFiles.length) {
      // console.log('No accepted files in drop')
      toast.error(`Failed to upload!`, {
        description: `No accepted files in drop. Only type/s '${accept}' allowed here`,
        dismissible: true,
        richColors: true,
      })
      return
    }

    await Promise.all(files.map(file => composerRuntime.addAttachment(file)))
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Convert dropped files into an array and pass to the handler
    const files = Array.from(e.dataTransfer.files)
    await handleFilesDropped(files)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  if (isReadOnly === null || isReadOnly) {
    return (
      <div className="flex items-center gap-3 py-2 px-4 h-[58px] border border-secondary rounded-lg bg-muted-darker">
        {isReadOnly === true ? (
          <>
            <PencilOffIcon className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm ">
              This is a read-only view of another user's conversation.
            </p>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <Composer.Root
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ComposerAttachmentDropzone isDragging={isDragging} accept={accept} />

      <LightboxGallery>
        <Composer.Attachments components={{ Attachment: MyAttachment }} />
      </LightboxGallery>

      <AuthClickGuard>
        <Composer.AddAttachment />
      </AuthClickGuard>

      <Composer.Input autoFocus className="text-base" />

      <ThreadPrimitive.If running={true}>
        <div className="flex items-center gap-3">
          <BotIcon className="animate-pulse duration-1000 text-purple-600" />
          <Composer.Cancel />
        </div>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running={false}>
        <AuthClickGuard>
          <Composer.Action />
        </AuthClickGuard>
      </ThreadPrimitive.If>
    </Composer.Root>
  )
}
