import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import customImageLoader from '@/image-loader'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  result: TaskV2Result
  task: TaskV2
}

const TimelineItemModelResult = ({ result, task }: Props) => {
  return (
    <>
      <div className="relative border-transparent bg-popover aspect-square">
        <Image
          loader={customImageLoader}
          src={result.thumbnail || ''}
          alt={task.args.name || ''}
          width={1024}
          height={1024}
          className="w-full h-full"
        />
      </div>
      <TimelineItemResultTools
        result={result}
        outputType={'model'}
        task={task}
        originalFilename={result.url || ''}
        fileName={task.args.name || '_noname_'}
      />
    </>
  )
}

export default TimelineItemModelResult
