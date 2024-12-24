import MyAttachment from '@/features/chat/components/attachment'
import { Composer, useComposerRuntime } from '@assistant-ui/react'
import { FC, useState } from 'react'

export const ComposerAttachmentDropzone = () => {
  const composerRuntime = useComposerRuntime()

  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (files: File[]) => {
    console.log('handleDrop', files)
    files.map(async file => {
      await composerRuntime.addAttachment(file)
    })
  }

  return (
    <div
      className={`absolute w-full h-full z-10 left-0 ${
        isDragging
          ? 'bg-muted/50 border border-muted-foreground border-dotted rounded-md overflow-hidden'
          : ''
      }`}
      onDrop={e => {
        e.preventDefault()
        setIsDragging(false)
        handleDrop(Array.from(e.dataTransfer.files))
      }}
      onDragOver={e => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      {isDragging && (
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center">
          <p className="font-semibold">Drop your files here</p>
        </div>
      )}
    </div>
  )
}

export const MyComposer: FC = () => {
  return (
    <Composer.Root className="relative">
      <ComposerAttachmentDropzone />
      <Composer.Attachments components={{ Attachment: MyAttachment }} />
      <Composer.AddAttachment />
      <Composer.Input autoFocus />
      <Composer.Action />
    </Composer.Root>
  )
}
