import PrivateIcon from '@/components/icons/private-icon'
import { LightboxTrigger } from '@/components/media/lightbox'
import { IntermediateOutputsDialog } from '@/components/timeline/intermediate-outputs-dialog'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TaskV2, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  queryKey: QueryKey
}

export const MediaResultOutput = ({
  task,
  output,
  index,
}: {
  task: TaskV2
  output: TasksV2ResultOutput
  index?: number
}) => {
  const width = output.mediaAttributes?.width ?? task.args?.width ?? 1024
  const height = output.mediaAttributes?.height ?? task.args?.height ?? 1024
  const aspectRatio =
    (width && height ? width / height : undefined) ||
    output?.mediaAttributes?.aspectRatio ||
    (task.output_type === 'audio' ? 3 : 1)

  const computeFitSize = (ratio: number) => {
    if (typeof window === 'undefined') {
      return { width: '100%', height: 'auto' }
    }
    const maxWidth = Math.min(window.innerWidth * 0.9, 1200)
    const maxHeight = window.innerHeight * 0.7

    let computedWidth = maxWidth
    let computedHeight = computedWidth / ratio

    if (computedHeight > maxHeight) {
      computedHeight = maxHeight
      computedWidth = computedHeight * ratio
    }

    return { width: computedWidth, height: computedHeight }
  }

  const [fitSize, setFitSize] = useState(() => computeFitSize(aspectRatio))

  useEffect(() => {
    const handleResize = () => setFitSize(computeFitSize(aspectRatio))
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [aspectRatio])

  return (
    <div
      className={cn([
        'relative bg-accent z-10 rounded-md w-full max-w-full',
        'overflow-hidden flex items-center justify-center mx-auto',
        'min-h-[260px] md:min-h-[320px] max-h-[70vh]',
      ])}
      style={{
        aspectRatio,
        width:
          typeof fitSize.width === 'number'
            ? `${fitSize.width}px`
            : fitSize.width,
        height:
          typeof fitSize.height === 'number'
            ? `${fitSize.height}px`
            : fitSize.height,
      }}
    >
      {!output.creation?.public ? <PrivateIcon /> : null}
      {output.creation && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/creations/${output.creation._id}`}
                className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 rounded-md p-1.5 transition-colors"
              >
                <ExternalLinkIcon className="h-4 w-4 text-white" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {output.creation === null || output.creation?.deleted ? (
        <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
          <div className="p-1 px-2 border border-destructive/50 bg-destructive/20 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
            deleted
          </div>
        </div>
      ) : null}
      {task.output_type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center">
          <audio
            src={output.url || output.filename}
            controls={true}
            loop={true}
          />
        </div>
      ) : (
        <LightboxTrigger
          className="w-full h-full"
          slide={{
            url: output.url || output.filename,
            thumbnail: output.thumbnail || output.filename,
            width,
            height,
            duration: output.mediaAttributes?.duration || undefined,
            title: task.tool || undefined,
            description: task.args?.prompt || undefined,
          }}
          startIndex={index}
          videoProps={{
            poster: output.thumbnail || undefined,
          }}
          imageProps={{
            customLoader: true,
            blurhash: output.mediaAttributes?.blurhash,
          }}
        />
      )}
    </div>
  )
}

const TimelineItemMediaResult = ({ task, result, index, queryKey }: Props) => {
  const num_samples = task.args?.n_samples || task.args?.num_outputs || false

  return (
    <>
      {result.output.map(output => (
        <div key={output.filename} className="p-2 bg-secondary rounded-md">
          <div
            className={cn([
              'relative',
              (output?.mediaAttributes?.aspectRatio || 1) < 1 &&
              (num_samples || 1) === 1
                ? 'max-h-[60vh] flex justify-center'
                : '',
            ])}
          >
            <MediaResultOutput task={task} output={output} index={index} />

            {result.intermediate_outputs ? (
              <IntermediateOutputsDialog
                intermediateOutputs={result.intermediate_outputs}
              />
            ) : null}
          </div>
          <TimelineItemResultTools
            task={task}
            result={result}
            output={output}
            index={index}
            queryKey={queryKey}
          />
        </div>
      ))}
    </>
  )
}

export default TimelineItemMediaResult
