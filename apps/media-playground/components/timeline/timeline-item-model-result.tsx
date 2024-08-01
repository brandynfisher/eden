import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { GeneratorOutputTypeV2, ModelV2, TaskV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  model: ModelV2
  task: TaskV2
  outputType: GeneratorOutputTypeV2
}

const TimelineItemModelResult = ({ model, task, outputType }: Props) => {
  return (
    <>
      <div className="relative border-transparent bg-popover aspect-square">
        <Image
          src={model.thumbnail}
          alt={model.name}
          width={1024}
          height={1024}
          className="w-full h-full"
        />
      </div>
      <TimelineItemResultTools
        outputType={outputType}
        task={task}
        downloadUri={model.checkpoint}
        fileName={model.slug.replace('/', '_') || '_noname_'}
      />
    </>
  )
}

export default TimelineItemModelResult
