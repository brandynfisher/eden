import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { useHover } from '@/hooks/use-hover'
import { GeneratorOutputTypeV2, TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'

// import LightboxGallery from '@/components/media/lightbox-gallery'

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
        className="relative border-transparent bg-popover z-10 shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
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
          <PhotoProvider loadingElement={<LoadingIndicator />}>
            <VideoDurationBadge duration={result.mediaAttributes?.duration} />
            <PhotoView
              width={1024}
              height={1024}
              render={({ attrs }) => {
                // Get the available viewport dimensions
                const viewportWidth = document.body.clientWidth
                const viewportHeight = document.body.clientHeight

                // Calculate the original video dimensions and aspect ratio
                const videoOriginalWidth = result.mediaAttributes?.width || 1024
                const videoOriginalHeight =
                  result.mediaAttributes?.height || 1024
                const aspectRatio = videoOriginalHeight / videoOriginalWidth

                // Calculate the scaled dimensions based on the viewport size
                let scaledWidth = viewportWidth
                let scaledHeight = scaledWidth * aspectRatio

                if (scaledHeight > viewportHeight) {
                  scaledHeight = viewportHeight
                  scaledWidth = scaledHeight / aspectRatio
                }

                // Center the video using flexbox and scale it appropriately
                return (
                  <div
                    {...attrs}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                        // transform: `scale(${scale})`,
                        // transformOrigin: 'center',
                      }}
                    >
                      <VideoResult
                        className="absolute inset-0 cursor-zoom-in con"
                        videoUrl={result.url || ''}
                        width={scaledWidth}
                        height={scaledHeight}
                        posterUrl={result.thumbnail}
                        muted={true}
                        loop={true}
                        autoPlay={true}
                        controls={true}
                      />
                    </div>
                  </div>
                )
              }}
            >
              <div>
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
                  />
                ) : null}
              </div>
            </PhotoView>
          </PhotoProvider>
        ) : null}
      </div>
      <TimelineItemResultTools
        outputType={outputType}
        task={task}
        result={result}
        originalFileUrl={result.url || ''}
        fileName={`${task.args?.prompt || '_noname'}_${index}`}
      />
      {/*<LightboxGallery />*/}
    </>
  )
}

export default TimelineItemMediaResult
