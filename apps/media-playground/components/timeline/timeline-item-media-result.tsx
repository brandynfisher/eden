import PrivateIcon from '@/components/icons/private-icon'
import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { IntermediateOutputsDialog } from '@/components/timeline/intermediate-outputs-dialog'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { cn } from '@/lib/utils'
import { TaskV2, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import React from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  queryKey: QueryKey
}

export const MediaResultOutput = ({
  task,
  output,
}: {
  task: TaskV2
  output: TasksV2ResultOutput
}) => {
  return (
    <div
      // className="relative bg-accent z-10 rounded-md"
      className={cn([
        'relative bg-accent z-10 rounded-md',
        'max-h-[calc(60vh_-_72.4px)]',
        (task.args.width ?? 1024) / (task.args.height ?? 1024) < 1 ||
        ((task.output_type === 'audio' ? 3 : 1) < 1 &&
          (task.args.n_samples || 1) === 1)
          ? 'h-full max-w-full flex justify-center '
          : (task.args.width ?? 1024) / (task.args.height ?? 1024) > 1 &&
            (task.args.n_samples || 1) === 1
          ? 'w-[calc(60vh_-_72.4px)] max-h-full max-w-full'
          : '',
      ])}
      style={{
        aspectRatio:
          output?.mediaAttributes?.aspectRatio ||
          (task.output_type === 'audio' ? 3 : 1),
        // height: '-webkit-fill-available',
      }}
    >
      {!output.creation?.public ? <PrivateIcon /> : null}
      {output.creation === null || output.creation?.deleted ? (
        <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
          <div className="p-1 px-2 border border-destructive/50 bg-destructive/20 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
            deleted
          </div>
        </div>
      ) : null}
      {task.output_type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center">
          <audio src={output.url || output.filename} controls={true} />
        </div>
      ) : (
        <LightboxGallery>
          <LightboxGalleryItem
            className="w-full h-full"
            item={{
              url: output.url || output.filename,
              thumbnail: output.thumbnail || output.filename,
              width: output.mediaAttributes?.width,
              height: output.mediaAttributes?.height,
              duration: output.mediaAttributes?.duration || undefined,
            }}
          />
        </LightboxGallery>
      )}
    </div>
  )
}

const TimelineItemMediaResult = ({ task, result, index, queryKey }: Props) => {
  return (
    <>
      {result.output.map(output => (
        <div key={output.filename} className="p-2 bg-secondary rounded-md">
          <div
            className={cn([
              'relative',
              (output?.mediaAttributes?.aspectRatio || 1) < 1 &&
              (task.args.n_samples || 1) === 1
                ? 'max-h-[60vh] flex justify-center'
                : '',
            ])}
          >
            <MediaResultOutput task={task} output={output} />

            {result.intermediateOutputs ? (
              <IntermediateOutputsDialog
                intermediateOutputs={result.intermediateOutputs}
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
