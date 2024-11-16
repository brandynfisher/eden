import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import PreviewVideoPlayer from '@/components/timeline/preview-video-player'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Long, cn, toBigInt } from '@/lib/utils'
import { TaskV2, TaskV2Args } from '@edenlabs/eden-sdk'
import { InfoIcon, SquareCheckBigIcon, SquareIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const imageInputParameterNames = [
  'image',
  'init_image',
  'control_image',
  'dummy_image',
  'person_image',
  'style_image',
  'images',
  'preference_anchor',
  'lora_training_urls',
]

const videoInputParameterNames = ['video', 'input_video']

type Props = {
  taskId: TaskV2['_id']
  args: TaskV2Args
  className?: string
}

const ParameterTable = ({ taskId, args, className }: Props) => {
  const [copiedText, copy] = useCopyToClipboard()
  const handleCopyString = (parameterName: string, text: string) => () => {
    copy(text)
      .then(() => {
        toast.success(`Copied "${parameterName}"`, {
          description: text,
          dismissible: true,
          richColors: true,
        })
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast.error(`Failed to copy!`, {
          description: error,
          dismissible: true,
          richColors: true,
        })
      })
  }

  return (
    <Table className={cn([`text-xs table-fixed w-full h-full`, className])}>
      <TableCaption className="mb-2 mt-0 md:mb-1 md:mt-2">
        <div className="flex w-full items-center justify-center gap-1 text-xs">
          <InfoIcon size={12} />
          Click a row to copy its value
        </div>
      </TableCaption>
      <TableHeader className="rounded-t-lg overflow-hidden md:rounded-none md:overflow-auto">
        <TableRow className="bg-popover/50">
          <TableHead className="h-10 py-2 w-1/3 md:w-[150px]">
            Parameter
          </TableHead>
          <TableHead className="h-10 py-2 w-2/3 md:w-auto">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-popover/20">
        {Object.entries({ taskId, ...args }).map(taskArg => (
          <TableRow
            key={taskArg[0]}
            className="cursor-pointer text-xs"
            onClick={handleCopyString(
              taskArg[0],
              String(taskArg[1] !== null ? taskArg[1] : ''),
            )}
          >
            <TableCell className="py-2 text-muted-foreground w-1/3 md:w-[150px]">
              {taskArg[0]}
            </TableCell>
            <TableCell className="py-2 w-2/3 md:w-auto truncate">
              {imageInputParameterNames.includes(taskArg[0]) ? (
                <div className="flex gap-2">
                  <LightboxGallery sizeOnLoad={true}>
                    {(
                      (Array.isArray(taskArg[1])
                        ? taskArg[1]
                        : [taskArg[1]]) as string[]
                    )
                      .filter(Boolean)
                      .map((inputImageUrl, index) => (
                        <LightboxGalleryItem
                          sizeOnLoad={true}
                          className="!relative rounded-lg cursor-zoom-in hover:brightness-105 !h-20 w-auto"
                          key={`${inputImageUrl}_${index}`}
                          item={{
                            url: getCloudfrontOriginalUrl(inputImageUrl),
                            thumbnail: getCloudfrontOriginalUrl(inputImageUrl),
                            width: 72,
                            height: 72,
                          }}
                          unoptimized={true}
                        />
                      ))}
                  </LightboxGallery>
                </div>
              ) : videoInputParameterNames.includes(taskArg[0]) ? (
                <div className="flex flex-wrap gap-2">
                  {(
                    (Array.isArray(taskArg[1])
                      ? taskArg[1]
                      : [taskArg[1]]) as string[]
                  )
                    .filter(Boolean)
                    .map(inputVideoUrl => (
                      <PreviewVideoPlayer
                        key={inputVideoUrl}
                        src={inputVideoUrl}
                        width={72}
                        height={72}
                        className="hover:brightness-105"
                      />
                    ))}
                </div>
              ) : typeof taskArg[1] === 'boolean' ? (
                taskArg[1] ? (
                  <SquareCheckBigIcon size={16} />
                ) : (
                  <SquareIcon size={16} />
                )
              ) : typeof taskArg[1] === 'object' &&
                !Array.isArray(taskArg[1]) ? (
                taskArg[1] !== null ? (
                  toBigInt(taskArg[1] as unknown as Long).toString()
                ) : (
                  '-'
                )
              ) : (
                taskArg[1]
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ParameterTable
