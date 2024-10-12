import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { LockIcon } from 'lucide-react'
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
      className="relative border-transparent bg-popover z-10 rounded-md"
      style={{
        aspectRatio:
          result?.mediaAttributes?.aspectRatio ||
          (task.output_type === 'audio' ? 3 : 1),
      }}
    >
      {!result.creation?.public ? (
        <LockIcon className="absolute h-4 w-4 top-2 text-white right-2 bg-gray-300 bg-opacity-20 rounded-sm p-0.5 drop-shadow backdrop-blur-[2px]" />
      ) : null}
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
      <MediaResult task={task} result={result} />
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
