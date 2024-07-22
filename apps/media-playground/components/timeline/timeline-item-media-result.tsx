import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
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
      <div className="relative border-transparent bg-popover">
        {result.url?.endsWith('.mp4') ? (
          <>
            {/*<Image*/}
            {/*  src={result.thumbnail || ''}*/}
            {/*  alt={result.thumbnail || ''}*/}
            {/*  width={result.mediaAttributes?.width || 1024}*/}
            {/*  height={result.mediaAttributes?.height || 1024}*/}
            {/*/>*/}
            {/* //@todo: add click/hoverable overlay that will drop in the video on demand and hide the image while playing */}
            <video
              src={result.url}
              loop={true}
              controls={true}
              controlsList={'nodownload'}
              onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
              className="w-full"
              width={result.mediaAttributes?.width || 1024}
              height={result.mediaAttributes?.height || 1024}
              // preload="none"
            />
          </>
        ) : (
          <Image
            src={result.url || ''}
            alt={result.url || ''}
            objectFit={'cover'}
            width={result.mediaAttributes?.width || 1024}
            height={result.mediaAttributes?.height || 1024}
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
