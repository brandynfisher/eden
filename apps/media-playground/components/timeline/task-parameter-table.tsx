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
import { useToast } from '@/components/ui/use-toast'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getToastConfig } from '@/lib/toast'
import { TaskV2 } from '@edenlabs/eden-sdk'
import { SquareCheckBigIcon, SquareIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

type Props = {
  task: TaskV2
}

const imageInputParameterNames = [
  'image',
  'init_image',
  'person_image',
  'style_image',
  'images',
  'preference_anchor',
  'lora_training_urls',
]

const videoInputParameterNames = ['video']

const TaskParameterTable = ({ task }: Props) => {
  const [copiedText, copy] = useCopyToClipboard()
  const { toast } = useToast()

  const handleCopyString = (parameterName: string, text: string) => () => {
    copy(text)
      .then(() => {
        toast(getToastConfig(`Copied "${parameterName}":`, text, 'success'))
        console.log('Copied!', { copiedText })
      })
      .catch(error => {
        toast(getToastConfig(`Failed to copy!`, error, 'error'))
        console.error('Failed to copy!', error)
      })
  }

  return (
    <Table className="text-xs mt-2 flex flex-col md:rounded-t-lg md:overflow-hidden md:table">
      <TableCaption className="mb-2 mt-0 md:mb-1 md:mt-2">
        Configuration used for this task
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
        {Object.entries(task.args).map(taskArg => (
          <TableRow
            className="cursor-copy text-xs flex flex-col md:table-row"
            key={taskArg[0]}
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
                <div className="flex flex-wrap gap-2">
                  {(
                    (Array.isArray(taskArg[1])
                      ? taskArg[1]
                      : [taskArg[1]]) as string[]
                  ).map(inputImageUrl => (
                    <Image
                      className="rounded-lg"
                      key={inputImageUrl}
                      src={inputImageUrl}
                      alt={taskArg[0]}
                      width={64}
                      height={64}
                    />
                  ))}
                </div>
              ) : videoInputParameterNames.includes(taskArg[0]) ? (
                <div className="flex flex-wrap gap-2">
                  {(
                    (Array.isArray(taskArg[1])
                      ? taskArg[1]
                      : [taskArg[1]]) as string[]
                  ).map(inputVideoUrl => (
                    <PreviewVideoPlayer
                      key={inputVideoUrl}
                      src={inputVideoUrl}
                      width={64}
                      height={64}
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

export default TaskParameterTable
