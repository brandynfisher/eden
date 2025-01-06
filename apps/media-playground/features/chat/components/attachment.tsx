import LoadingIndicator from '@/components/loading-indicator'
import { LightboxTrigger } from '@/components/media/lightbox'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { Progress } from '@/components/ui/progress'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  AttachmentPrimitive,
  ImageContentPart,
  useAttachment,
  useThreadConfig,
} from '@assistant-ui/react'
import { CircleXIcon } from 'lucide-react'
import React, { FC, useEffect, useState } from 'react'
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

// type AttachmentPreviewProps = {
//   src: string
// }

// const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
//   const [isLoaded, setIsLoaded] = useState(false)
//
//   return (
//     // eslint-disable-next-line @next/next/no-img-element
//     <img
//       src={src}
//       style={{
//         maxHeight: '75dvh',
//         display: isLoaded ? 'block' : 'none',
//         overflow: 'clip',
//       }}
//       className={'object-contain max-w-full w-auto h-auto'}
//       onLoad={() => setIsLoaded(true)}
//       alt='Image Preview'
//     />
//   )
// }
//
// const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
//   const attachment = useAttachment()
//   const src = useAttachmentSrc()
//
//   if (!src) return children
//
//   return (
//     <Dialog>
//       <DialogTrigger asChild>{children}</DialogTrigger>
//       <DialogContent className='w-3/4 justify-center'>
//         <DialogTitle className='sr-only'>Image Attachment Preview</DialogTitle>
//         <DialogDescription className='truncate'>{attachment.name}</DialogDescription>
//         <AttachmentPreview src={src} />
//       </DialogContent>
//     </Dialog>
//   )
// }

// const AttachmentThumb: FC = () => {
//   const isImage = useAttachment(a => a.type === 'image')
//   const canRemove = useAttachment(a => a.source !== 'message')
//   const src = useAttachmentSrc()
//
//   return (
//     <div className={cn(['flex-shrink-0 max-w-16 h-10', !canRemove ? 'max-w-36 h-20' : ''])}>
//       {isImage ? (
//         // eslint-disable-next-line @next/next/no-img-element
//         <img src={src} alt={src} className='object-cover w-auto h-full rounded-md' />
//       ) : (
//         <FileIcon />
//       )}
//     </div>
//   )
// }

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
  // const typeLabel = useAttachment(a => {
  //   const type = a.type
  //   switch (type) {
  //     case 'image':
  //       return 'Image'
  //     case 'document':
  //       return 'Document'
  //     case 'file':
  //       return 'File'
  //     default:
  //       throw new Error(`Unknown attachment type: ${type as never}`)
  //   }
  // })

  const uploadProgress = useAttachment(a =>
    a.status.type === 'running' ? a.status.progress : 1,
  )
  const attachment = useAttachment()
  // @ts-ignore
  const fileUrl = attachment.file ? attachment.file.fileUrl : ''

  const src = useAttachmentSrc()

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
        {/*<AttachmentThumb />*/}
        <LightboxTrigger
          startIndex={attachment.id ? parseInt(attachment.id) : undefined}
          className="flex items-center justify-center"
          slide={{
            url: canRemove
              ? getCloudfrontOriginalUrl(fileUrl)
              : src ?? siteConfig.mediaErrorUrl,
            thumbnail: src ?? siteConfig.mediaErrorUrl,
          }}
          imageProps={{
            className: canRemove
              ? 'object-cover flex-shrink-0 max-w-16 h-12'
              : 'object-contain w-full max-h-48 max-w-48 flex-shrink-0',
            unoptimized: true,
          }}
        />

        {/*{canRemove ? (*/}
        {/*  <div className='text-xs overflow-hidden'>*/}
        {/*    <div className='truncate text-accent-foreground'>*/}
        {/*      <AttachmentPrimitive.Name />*/}
        {/*      <p className='text-muted-foreground'>{typeLabel}</p>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*) : null}*/}
      </div>
      {canRemove && <AttachmentRemove />}
    </AttachmentPrimitive.Root>
  )
}

export default MyAttachment

// <LightboxTrigger
// slide={{
//   url: '/123.png',
//     thumbnail: '/123.png',
// }}
// />

// {/*<AttachmentPreviewDialog>*/}
// {/*<AttachmentPrimitive.Root*/}
// {/*  className={cn(['relative rounded-lg border border-secondary cursor-pointer ', canRemove ? ' mt-2 hover:bg-accent' : 'w-auto items-center'])}>*/}
// {/*  {uploadProgress !== 1 ? (*/}
// {/*    <div className='absolute rounded-md bg-background/40 w-full h-full overflow-hidden'>*/}
// {/*      <LoadingIndicator className='w-full h-full p-1.5' />*/}
// {/*      <Progress*/}
// {/*        max={1}*/}
// {/*        value={uploadProgress}*/}
// {/*        className='h-1 bottom-0.5 rounded-none bg-transparent'*/}
// {/*      />*/}
// {/*    </div>*/}
// {/*  ) : null}*/}
// {/*  <div className={cn(['p-1 flex gap-1', !canRemove ? 'flex-col items-center' : ''])}>*/}
// {/*    <AttachmentThumb />*/}
// {/*    /!*{canRemove ? (*!/*/}
// {/*    /!*  <div className='text-xs overflow-hidden'>*!/*/}
// {/*    /!*    <div className='truncate text-accent-foreground'>*!/*/}
// {/*    /!*      <AttachmentPrimitive.Name />*!/*/}
// {/*    /!*      <p className='text-muted-foreground'>{typeLabel}</p>*!/*/}
// {/*    /!*    </div>*!/*/}
// {/*    /!*  </div>*!/*/}
// {/*    /!*) : null}*!/*/}
// {/*  </div>*/}
// {/*  {canRemove && <AttachmentRemove />}*/}
// {/*</AttachmentPrimitive.Root>*/}
// {/*</AttachmentPreviewDialog>*/}
