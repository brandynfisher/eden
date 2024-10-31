import PrivateIcon from '@/components/icons/private-icon'
import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { IntermediateOutputsDialog } from '@/components/timeline/intermediate-outputs-dialog'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { cn } from '@/lib/utils'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import React from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  queryKey: QueryKey
}

export const MediaResult = ({
  task,
  result,
}: {
  task: TaskV2
  result: TaskV2Result
}) => {
  return (
    <div
      // className="relative bg-accent z-10 rounded-md"
      className={cn([
        'relative bg-accent z-10 rounded-md',
        'max-h-[calc(60dvh_-_72.4px)]',
        (task.args.width ?? 1024) / (task.args.height ?? 1024) < 1 ||
        ((task.output_type === 'audio' ? 3 : 1) < 1 &&
          (task.args.n_samples || 1) === 1)
          ? 'h-full max-w-full flex justify-center '
          : (task.args.width ?? 1024) / (task.args.height ?? 1024) > 1 &&
            (task.args.n_samples || 1) === 1
          ? 'w-[calc(60dvh_-_72.4px)] max-h-full max-w-full'
          : '',
      ])}
      style={{
        aspectRatio:
          result?.mediaAttributes?.aspectRatio ||
          (task.output_type === 'audio' ? 3 : 1),
        // height: '-webkit-fill-available',
      }}
    >
      {!result.creation?.public ? <PrivateIcon /> : null}
      {result.creation === null || result.creation?.deleted ? (
        <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
          <div className="p-1 px-2 border border-destructive/50 bg-destructive/20 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
            deleted
          </div>
        </div>
      ) : null}
      {task.output_type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center">
          <audio src={result.url || result.filename} controls={true} />
        </div>
      ) : (
        <LightboxGallery>
          <LightboxGalleryItem
            className="w-full h-full"
            item={{
              url: result.url || result.filename,
              thumbnail: result.thumbnail || result.filename,
              width: result.mediaAttributes?.width,
              height: result.mediaAttributes?.height,
              duration: result.mediaAttributes?.duration || undefined,
            }}
          />
        </LightboxGallery>
      )}
    </div>
  )
}

const TimelineItemMediaResult = ({ task, result, index, queryKey }: Props) => {
  return (
    <div className="p-2 bg-secondary rounded-md">
      <div
        className={cn([
          'relative',
          (result?.mediaAttributes?.aspectRatio || 1) < 1 &&
          (task.args.n_samples || 1) === 1
            ? 'max-h-[60dvh] flex justify-center'
            : '',
        ])}
      >
        <MediaResult task={task} result={result} />
        {result.intermediateOutputs ? (
          <IntermediateOutputsDialog result={result} />
        ) : null}
      </div>
      <TimelineItemResultTools
        task={task}
        result={result}
        index={index}
        queryKey={queryKey}
      />
    </div>
  )
}

export default TimelineItemMediaResult
