import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { GeneratorOutputTypeV2, TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React, { Ref, useRef, useState } from 'react'

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
  const [initialPlay, setInitialPlay] = useState(false)
  // console.log({ task, result })
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null)

  const handleVideoClick = async () => {
    const videoElement = mediaRef.current as HTMLVideoElement

    if (videoElement.paused) {
      await videoElement.play()
      setInitialPlay(true)
    }
  }

  return (
    <>
      <div
        className="relative border-transparent bg-popover"
        style={{ aspectRatio: result?.mediaAttributes?.aspectRatio || 1 }}
      >
        {result.url?.endsWith('.mp4') ? (
          <video
            ref={mediaRef as Ref<HTMLVideoElement>}
            poster={result.thumbnail || ''}
            src={result.url}
            loop={true}
            controls={true}
            controlsList={'nodownload'}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
            className="w-full h-full"
            width={result.mediaAttributes?.width || task.args.width || 1024}
            height={result.mediaAttributes?.height || task.args.height || 1024}
            preload={'none'}
            onClick={!initialPlay ? handleVideoClick : undefined}
          />
        ) : (
          <Image
            src={result.thumbnail || result.url || ''}
            alt={result.thumbnail || result.url || ''}
            objectFit={'cover'}
            width={result.mediaAttributes?.width || task.args.width || 1024}
            height={result.mediaAttributes?.height || task.args.height || 1024}
            className="object-cover w-full"
          />
        )}
      </div>
      <TimelineItemResultTools
        outputType={outputType}
        task={task}
        downloadUri={result.url || ''}
        fileName={`${task.args?.prompt || '_noname'}_${index}`}
      />
    </>
  )
}

export default TimelineItemMediaResult
