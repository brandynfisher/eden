import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { useHover } from '@/hooks/use-hover'
import { GeneratorOutputTypeV2, TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  outputType: GeneratorOutputTypeV2
}

const TimelineItemMediaResult = ({
  task,
  result,
  index,
  outputType,
}: Props) => {
  // console.log({ task, result })
  const { hovered, ref } = useHover()

  return (
    <>
      <div
        ref={ref}
        className="relative border-transparent bg-popover"
        style={{ aspectRatio: result?.mediaAttributes?.aspectRatio || 1 }}
      >
        <PhotoProvider loadingElement={<LoadingIndicator />}>
          <PhotoView src={result.url}>
            <Image
              src={result.thumbnail || result.url || ''}
              alt={result.thumbnail || result.url || ''}
              objectFit={'cover'}
              width={result.mediaAttributes?.width || task.args.width || 1024}
              height={
                result.mediaAttributes?.height || task.args.height || 1024
              }
              className="object-cover w-full cursor-zoom-in"
            />
          </PhotoView>
        </PhotoProvider>
        {result.url?.endsWith('.mp4') ? (
          <>
            <VideoDurationBadge duration={result.mediaAttributes?.duration} />
            {hovered ? (
              <VideoResult
                className="absolute inset-0 cursor-zoom-in"
                videoUrl={result.url || ''}
                width={result.mediaAttributes?.width}
                height={result.mediaAttributes?.height}
                posterUrl={result.thumbnail}
                muted={true}
                loop={true}
                autoPlay={true}
                controls={false}
                allowFullscreen={true}
              />
            ) : null}
          </>
        ) : null}
      </div>
      <TimelineItemResultTools
        outputType={outputType}
        task={task}
        result={result}
        originalFileUrl={result.url || ''}
        fileName={`${task.args?.prompt || '_noname'}_${index}`}
      />
    </>
  )
}

export default TimelineItemMediaResult
