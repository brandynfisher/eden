import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import TimelineItemVideo from '@/components/timeline/timeline-item-video'
import { GeneratorOutputTypeV2, TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

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

  return (
    <>
      <div
        className="relative border-transparent bg-popover"
        style={{ aspectRatio: result?.mediaAttributes?.aspectRatio || 1 }}
      >
        {result.url?.endsWith('.mp4') ? (
          <TimelineItemVideo
            width={result.mediaAttributes?.width || task.args.width}
            height={result.mediaAttributes?.height || task.args.height}
            videoUrl={result.url}
            posterUrl={result.thumbnail}
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
        originalFileUrl={result.url || ''}
        fileName={`${task.args?.prompt || '_noname'}_${index}`}
      />
    </>
  )
}

export default TimelineItemMediaResult
