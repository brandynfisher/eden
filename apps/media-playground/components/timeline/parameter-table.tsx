import LoadingIndicator from '@/components/loading-indicator'
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
import { TaskV2Args } from '@edenlabs/eden-sdk'
import { InfoIcon, SquareCheckBigIcon, SquareIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { toast } from 'sonner'

type Props = {
  args: TaskV2Args
}

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

const ParameterTable = ({ args }: Props) => {
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
    <Table className="text-xs flex flex-col md:overflow-hidden md:table h-full">
      <TableCaption className="mb-2 mt-0 md:mb-1 md:mt-2">
        <div className="flex w-full items-center justify-center gap-1 text-xs">
          <InfoIcon size={12} />
          Click a row to copy its value
        </div>
      </TableCaption>
      <TableHeader className="rounded-t-lg overflow-hidden md:rounded-none md:overflow-auto">
        <TableRow className="bg-popover/50 block md:table-row">
          <TableHead className="h-10 py-2 w-full md:w-[100px]">
            Parameter
          </TableHead>
          <TableHead className="h-10 py-2 hidden md:table-cell">
            Value
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-popover/20">
        {Object.entries(args).map(taskArg => (
          <TableRow
            key={taskArg[0]}
            className="cursor-pointer text-xs flex flex-col md:table-row"
            onClick={handleCopyString(
              taskArg[0],
              String(taskArg[1] !== null ? taskArg[1] : ''),
            )}
          >
            <TableCell className="py-2 text-muted-foreground">
              {taskArg[0]}
            </TableCell>
            <TableCell className="pt-0 pb-2 md:py-2">
              {imageInputParameterNames.includes(taskArg[0]) ? (
                <PhotoProvider loadingElement={<LoadingIndicator />}>
                  <div className="flex flex-wrap gap-2">
                    {(
                      (Array.isArray(taskArg[1])
                        ? taskArg[1]
                        : [taskArg[1]]) as string[]
                    )
                      .filter(Boolean)
                      .map(inputImageUrl => (
                        <PhotoView key={inputImageUrl} src={inputImageUrl}>
                          <Image
                            onClick={e => e.stopPropagation()}
                            className="rounded-lg cursor-zoom-in hover:brightness-105"
                            src={inputImageUrl}
                            title="Click to show image in fullscreen"
                            alt={taskArg[0]}
                            width={72}
                            height={72}
                          />
                        </PhotoView>
                      ))}
                  </div>
                </PhotoProvider>
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
