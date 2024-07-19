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
            className="w-full"
          />
        ) : (
          <Image
            src={mediaUri}
            alt={mediaUri}
            // fill={true}
            objectFit={'cover'}
            width={task.args.width || 1024}
            height={task.args.height || 1024}
            className="object-cover w-full"
          />
        )}
      </div>
      <TimelineItemResultTools
        task={task}
        downloadUri={mediaUri}
        fileName={`${task.args?.prompt || '_noname'}_${index}`}
      />
    </>
  )
}

export default TimelineItemMediaResult
