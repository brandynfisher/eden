import MyAttachment from '@/features/chat/components/attachment'
import { Composer, useComposerRuntime } from '@assistant-ui/react'
import React, { FC, useState } from 'react'

type ComposerAttachmentDropzoneProps = {
  isDragging: boolean
}

export const ComposerAttachmentDropzone: FC<
  ComposerAttachmentDropzoneProps
> = ({ isDragging }) => {
  return (
    <div
      className={`absolute w-full h-full z-10 left-0 ${
        isDragging
          ? 'pointer-events-auto bg-muted/50 border border-muted-foreground border-dotted rounded-md overflow-hidden'
          : 'pointer-events-none'
      }`} // Pass drop event here to handle file uploads
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-purple-400">Drop your files here</p>
        </div>
      )}
    </div>
  )
}

export const MyComposer: FC = () => {
  const [isDragging, setIsDragging] = useState(false)
  const composerRuntime = useComposerRuntime()

  const handleFilesDropped = async (files: File[]) => {
    // Handle file uploads here using runtime
    console.log('Files dropped:', files)
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
      onDrop={handleDrop} // Reset state when drop completes
    >
      <ComposerAttachmentDropzone isDragging={isDragging} />
      <Composer.Attachments components={{ Attachment: MyAttachment }} />
      <Composer.AddAttachment />
      <Composer.Input autoFocus />
      <Composer.Action />
    </Composer.Root>
  )
}
