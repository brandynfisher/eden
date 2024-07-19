import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { ModelV2, TaskV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  model: ModelV2
  task: TaskV2
}

const TimelineItemModelResult = ({ model, task }: Props) => {
  return (
    <>
      <div className="relative border-transparent bg-popover">
        <Image
          src={model.thumbnail}
          alt={model.name}
          // fill={true}
          objectFit={'cover'}
          width={task.args.width || 1024}
          height={task.args.height || 1024}
          className="object-cover w-full rounded-bl-lg rounded-br-lg"
        />
      </div>
      <div className="mt-2">
        <TimelineItemResultTools
          task={task}
          downloadUri={model.checkpoint}
          fileName={model.slug.replace('/', '_') || '_noname_'}
        />
      </div>
    </>
  )
}

export default TimelineItemModelResult
