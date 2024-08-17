import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import VideoResult from '@/components/media/video-result'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { useHover } from '@/hooks/use-hover'
import { GeneratorOutputTypeV2, TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'

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
  const { hovered, ref: hoverRef } = useHover()

  return (
    <>
      <div
        ref={hoverRef}
        className="relative border-transparent bg-popover z-10 shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
        style={{ aspectRatio: result?.mediaAttributes?.aspectRatio || 1 }}
      >
        <Gallery options={{ bgOpacity: 1 }}>
          {/* //@todo: extract image and video item as re-usable components to encapsulate special handling */}
          <Item
            original={result.url?.endsWith('.mp4') ? undefined : result.url}
            thumbnail={result.thumbnail}
            width={result.mediaAttributes?.width || task.args.width || 1024}
            height={result.mediaAttributes?.height || task.args.height || 1024}
            content={
              result.url?.endsWith('.mp4') ? (
                <VideoResult
                  // className="absolute inset-0 cursor-zoom-in con"
                  videoUrl={result.url || ''}
                  width={
                    result.mediaAttributes?.width || task.args.width || 1024
                  }
                  height={
                    result.mediaAttributes?.height || task.args.height || 1024
                  }
                  posterUrl={result.thumbnail}
                  muted={true}
                  loop={true}
                  autoPlay={true}
                  controls={true}
                />
              ) : undefined
            }
          >
            {({ ref, open }) => (
              <>
                <Image
                  ref={ref}
                  onClick={open}
                  src={result.thumbnail || result.url || ''}
                  alt={result.thumbnail || result.url || ''}
                  objectFit={'cover'}
                  width={
                    result.mediaAttributes?.width || task.args.width || 1024
                  }
                  height={
                    result.mediaAttributes?.height || task.args.height || 1024
                  }
                  className="object-cover w-full cursor-zoom-in"
                />
                {result.url?.endsWith('.mp4') ? (
                  <>
                    <VideoDurationBadge
                      duration={result.mediaAttributes?.duration}
                    />
                    {hovered ? (
                      <VideoResult
                        className="absolute inset-0 cursor-zoom-in pointer-events-none"
                        videoUrl={result.url || ''}
                        width={result.mediaAttributes?.width}
                        height={result.mediaAttributes?.height}
                        posterUrl={result.thumbnail}
                        muted={true}
                        loop={true}
                        autoPlay={true}
                        controls={false}
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </Item>
        </Gallery>
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
