import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import customImageLoader from '@/image-loader'
import {
  GeneratorOutputTypeV2,
  ModelV2,
  TaskV2,
  TaskV2Result,
} from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  result: TaskV2Result
  model: ModelV2
  task: TaskV2
  outputType: GeneratorOutputTypeV2
}

const TimelineItemModelResult = ({
  result,
  model,
  task,
  outputType,
}: Props) => {
  return (
    <>
      <div className="relative border-transparent bg-popover aspect-square">
        <Image
          loader={customImageLoader}
          src={model.thumbnail}
          alt={model.name}
          width={1024}
          height={1024}
          className="w-full h-full"
        />
      </div>
      <TimelineItemResultTools
        result={result}
        outputType={outputType}
        task={task}
        originalFilename={model.checkpoint}
        fileName={model.slug.replace('/', '_') || '_noname_'}
      />
    </>
  )
}

export default TimelineItemModelResult
