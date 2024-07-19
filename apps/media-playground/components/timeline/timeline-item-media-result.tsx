import TimelineItemResultTools from '@/components/timeline/timeline-item-result-tools'
import { TaskV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  mediaUri: string
  task: TaskV2
  index: number
}

const TimelineItemMediaResult = ({ task, mediaUri, index }: Props) => {
  console.log(mediaUri)
  return (
    <>
      <div className="relative border-transparent bg-popover">
        {mediaUri.endsWith('.mp4') ? (
          <video
            src={mediaUri}
            loop={true}
            controls={true}
            controlsList={'nodownload'}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
            className="w-full rounded-bl-lg rounded-br-lg"
          />
        ) : (
          <Image
            src={mediaUri}
            alt={mediaUri}
            // fill={true}
            objectFit={'cover'}
            width={task.args.width || 1024}
            height={task.args.height || 1024}
            className="object-cover w-full rounded-bl-lg rounded-br-lg"
          />
        )}
      </div>
      <div className="mt-2">
        <TimelineItemResultTools
          task={task}
          downloadUri={mediaUri}
          fileName={`${task.args?.prompt || '_noname'}_${index}`}
        />
      </div>
    </>
  )
}

export default TimelineItemMediaResult
