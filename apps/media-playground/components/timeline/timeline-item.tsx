import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  item: TaskV2
}

const TimelineItem = ({ item }: Props) => {
  return (
    <div data-test-id="timeline-item" key={item._id}>
      <TaskParameterList task={item} />

      <div className="relative flex flex-col min-h-32 items-center justify-around">
        <TaskStatusBadge status={item.status} hideText={true} />

        {item.status === 'failed' ? (
          <div className="h-full">
            <div className="text-destructive">Task failed</div>
            <div>{item.error}</div>
          </div>
        ) : null}

        {item.status === 'pending' || item.status === 'running' ? (
          <div className="w-full">
            <AspectRatio
              ratio={(item.args.width || 1024) / (item.args.height || 1024)}
            >
              <Skeleton className="w-full h-full" />
            </AspectRatio>
          </div>
        ) : null}

        {item.status === 'completed' && item.result && item.result.length
          ? item.result.map(result => (
              <div className="relative border-transparent" key={result}>
                {result.startsWith('http') ? (
                  <>
                    {result.endsWith('.mp4') ? (
                      <video
                        src={result}
                        controls={true}
                        controlsList={'nodownload'}
                        onContextMenu={(e: React.MouseEvent) =>
                          e.preventDefault()
                        }
                      />
                    ) : (
                      <Image
                        src={result}
                        alt={result}
                        // fill={true}
                        objectFit={'cover'}
                        width={item.args.width || 0}
                        height={item.args.height || 0}
                        className="object-cover w-full rounded-lg"
                      />
                    )}
                  </>
                ) : (
                  // result is model / concept
                  // @todo: fetch model data by it's id or pre-populate this api-side for a successful task
                  <>concept: {result}</>
                )}
              </div>
            ))
          : null}
      </div>
    </div>
  )
}

export default TimelineItem
