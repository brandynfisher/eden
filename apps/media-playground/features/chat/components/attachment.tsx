import LoadingIndicator from '@/components/loading-indicator'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AttachmentPrimitive,
  ImageContentPart,
  useAttachment,
  useThreadConfig,
} from '@assistant-ui/react'
import { CircleXIcon, FileIcon } from 'lucide-react'
import { FC, PropsWithChildren, useEffect, useState } from 'react'
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

type AttachmentPreviewProps = {
  src: string
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      style={{
        maxHeight: '75dvh',
        display: isLoaded ? 'block' : 'none',
        overflow: 'clip',
      }}
      className={'object-contain max-w-full w-auto h-auto'}
      onLoad={() => setIsLoaded(true)}
      alt="Image Preview"
    />
  )
}

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc()

  if (!src) return children

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-3/4 justify-center">
        <DialogTitle className="sr-only">Image Attachment Preview</DialogTitle>
        <AttachmentPreview src={src} />
      </DialogContent>
    </Dialog>
  )
}

const AttachmentThumb: FC = () => {
  const attachment = useAttachment(a => a)
  const isImage = attachment.type === 'image'
  const src = useAttachmentSrc()

  return (
    <div className="flex-shrink-0 max-w-10 h-10">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={src} className="object-cover h-full rounded-md" />
      ) : (
        <FileIcon />
      )}
    </div>
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
  const typeLabel = useAttachment(a => {
    const type = a.type
    switch (type) {
      case 'image':
        return 'Image'
      case 'document':
        return 'Document'
      case 'file':
        return 'File'
      default:
        throw new Error(`Unknown attachment type: ${type as never}`)
    }
  })

  const uploadProgress = useAttachment(a =>
    a.status.type === 'running' ? a.status.progress : 1,
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <AttachmentPreviewDialog>
          <TooltipTrigger asChild>
            <AttachmentPrimitive.Root className="relative mt-2 border border-secondary hover:bg-accent rounded-lg cursor-pointer w-32">
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
              <div className="p-2 flex gap-2">
                <AttachmentThumb />
                <div className="text-xs overflow-hidden">
                  <p className="truncate text-accent-foreground">
                    <AttachmentPrimitive.Name />
                  </p>
                  <p className="text-muted-foreground">{typeLabel}</p>
                </div>
              </div>
              {canRemove && <AttachmentRemove />}
            </AttachmentPrimitive.Root>
          </TooltipTrigger>
        </AttachmentPreviewDialog>
        <TooltipContent side="top">
          <AttachmentPrimitive.Name />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default MyAttachment
