import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { getFileTypeByMimeType } from '@/lib/files'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
}

const TimelineItemMediaResult = ({ task, result }: Props) => {
  const fileType = getFileTypeByMimeType(result.mediaAttributes?.mimeType)

  return (
    <>
      <div
        className="relative border-transparent bg-popover z-10 shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
        style={{
          aspectRatio:
            result?.mediaAttributes?.aspectRatio ||
            (fileType === 'audio' ? 3 : 1),
        }}
      >
        {fileType === 'audio' ? (
          <div className="flex w-full h-full items-center justify-center">
            <audio src={result.url || result.filename} controls={true} />
          </div>
        ) : (
          <LightboxGallery withDownloadButton={true}>
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
      <TimelineItemResultTools task={task} result={result} />
    </>
  )
}

export default TimelineItemMediaResult
