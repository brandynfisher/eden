import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import customImageLoader from '@/image-loader'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import Image from 'next/image'
import React from 'react'

type Props = {
  result: TaskV2Result
  task: TaskV2
  index: number
  queryKey: QueryKey
}

const TimelineItemModelResult = ({ result, task, index, queryKey }: Props) => {
  return (
    <div className="p-2 bg-secondary rounded-md ">
      <div className="max-h-[60dvh] aspect-square rounded-md overflow-hidden">
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
        task={task}
        index={index}
        queryKey={queryKey}
      />
    </div>
  )
}

export default TimelineItemModelResult
