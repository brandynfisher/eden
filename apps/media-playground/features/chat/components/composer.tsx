import MyAttachment from '@/features/chat/components/attachment'
import { fileMatchesAccept } from '@/features/chat/utils/files'
import { Composer, useComposerRuntime } from '@assistant-ui/react'
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
      className={`absolute w-full h-full z-10 left-0 ${
        isDragging
          ? 'pointer-events-auto bg-muted/50 border border-muted-foreground border-dotted rounded-md overflow-hidden'
          : 'pointer-events-none'
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm text-purple-400">Drop attachments here</p>
          <div className="text-xs text-muted-foreground">
            Accepted: <span className="font-semibold">{accept}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const MyComposer: FC = () => {
  const [isDragging, setIsDragging] = useState(false)
  const composerRuntime = useComposerRuntime()
  const accept = composerRuntime.getAttachmentAccept()

  const handleFilesDropped = async (files: File[]) => {
    // accept contains mimetypes with wildcards like image/* allow only these

    const acceptedFiles = files.filter(file => fileMatchesAccept(file, accept))

    if (!acceptedFiles.length) {
      console.log('No accepted files in drop')
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

  return (
    <Composer.Root
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ComposerAttachmentDropzone isDragging={isDragging} accept={accept} />
      <Composer.Attachments components={{ Attachment: MyAttachment }} />
      <Composer.AddAttachment />
      <Composer.Input autoFocus />
      <Composer.Action />
    </Composer.Root>
  )
}
