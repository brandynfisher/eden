import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import TimelineItemMediaResult from '@/components/timeline/timeline-item-media-result'
import TimelineItemModelResult from '@/components/timeline/timeline-item-model-result'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { useAuthState } from '@/hooks/use-auth-state'
import { ModelV2, TaskV2 } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import React, { useCallback, useState } from 'react'

type Props = {
  item: TaskV2
}

const TimelineItem = ({ item }: Props) => {
  const { verifyAuth } = useAuthState()
  const { toast } = useToast()

  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = useCallback(async (taskId: TaskV2['_id']) => {
    if (!(await verifyAuth())) {
      return
    }

    setIsCancelling(true)

    try {
      const response = await axios.post('/api/tasks/cancel', {
        taskId,
      })

      toast({
        className: 'flex p-4',
        title: 'Task cancelled',
        description: (
          <div className="mt-2 rounded-md bg-popover p-2">
            <code className=" text-xs text-foreground">
              taskId: {taskId} | status: {response.data.status}
            </code>
          </div>
        ),
      })
    } catch (err) {
      console.log(err)
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'
      toast({
        className: 'flex p-4 text-red-600',
        title: 'Failed to cancel task',
        description: (
          <div className="rounded-md text-primary">
            {JSON.stringify(errorMessage)}
          </div>
        ),
      })
    } finally {
      setIsCancelling(false)
    }
  }, [])

  return (
    <div data-test-id="timeline-item" key={item._id}>
      <TaskParameterList task={item} />
      {item.status !== 'completed' ? (
        <div className="relative flex flex-col min-h-32 items-center justify-around bg-popover rounded-bl-lg rounded-br-lg">
          <TaskStatusBadge status={item.status} hideText={true} />

          {item.status === 'failed' ? (
            <div className="h-full">
              <div className="text-destructive">Task failed</div>
              <div>{item.error}</div>
            </div>
          ) : null}

          {item.status === 'cancelled' ? (
            <div className="h-full">
              <div className="text-warning">Task cancelled</div>
              <div>{item.error}</div>
            </div>
          ) : null}

          {item.status === 'pending' || item.status === 'running' ? (
            <div className="w-full relative">
              <AspectRatio
                ratio={(item.args.width || 1024) / (item.args.height || 1024)}
              >
                <Skeleton className="w-full h-full rounded-t-none rounded-bl-lg rounded-br-lg" />
              </AspectRatio>
              <div className="absolute inset-0 text-center self-center text-sm text-muted-foreground">
                {item.status === 'pending'
                  ? 'Waiting to start...'
                  : `Generating...`}
              </div>
              <Button
                // size='xs'
                variant="outline"
                type="button"
                className="absolute px-2 py-0 h-6 bottom-4 right-4 text-warning/40 text-xs bg-popover/40 hover:bg-popover/70"
                onClick={() => handleCancel(item._id)}
                disabled={isCancelling}
              >
                Cancel Task
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          {item.status === 'completed' &&
          item.result &&
          Array.isArray(item.result) ? (
            item.result.map((result, index) => (
              // task result is an array of image/video/audio URIs
              <TimelineItemMediaResult
                key={`${item._id}_${result}`}
                index={index}
                task={item}
                mediaUri={result as string}
              />
            ))
          ) : (
            // task result is ObjectId of model, api populates a model property with the full model document
            <TimelineItemModelResult
              task={item}
              model={item.model as unknown as ModelV2}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default TimelineItem
