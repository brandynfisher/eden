import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
}

const TimelineItemMediaResult = ({ task, result, index }: Props) => {
  return (
    <>
      <div
        className="relative border-transparent bg-popover z-10 shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
        style={{
          aspectRatio:
            result?.mediaAttributes?.aspectRatio ||
            (task.output_type === 'audio' ? 3 : 1),
        }}
      >
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
      <TimelineItemResultTools task={task} result={result} index={index} />
    </>
  )
}

export default TimelineItemMediaResult
