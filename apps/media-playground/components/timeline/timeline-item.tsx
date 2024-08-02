import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import TimelineItemMediaResult from '@/components/timeline/timeline-item-media-result'
import TimelineItemModelResult from '@/components/timeline/timeline-item-model-result'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthState } from '@/hooks/use-auth-state'
import { GeneratorOutputTypeV2, ModelV2, TaskV2 } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  item: TaskV2
  outputType: GeneratorOutputTypeV2
}

const TimelineItem = ({ item, outputType }: Props) => {
  const { verifyAuth } = useAuthState()

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

      toast.info(`Task cancelled`, {
        description: (
          <code className=" text-xs text-foreground">
            taskId: {taskId} | status: {response.data.status}
          </code>
        ),
        dismissible: true,
        richColors: true,
      })
    } catch (err) {
      console.log(err)
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'
      toast.error(`Failed to cancel task`, {
        description: JSON.stringify(errorMessage),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsCancelling(false)
    }
  }, [])

  return (
    <div data-test-id="timeline-item" key={item._id}>
      <TaskParameterList task={item} />
      {item.status !== 'completed' ? (
        <div className="relative bg-muted rounded-bl-lg rounded-br-lg">
          {item.status === 'failed' ? (
            <div className="h-full p-2">
              <TaskStatusBadge status={item.status} />
              <div className="mt-1 text-muted-foreground text-sm line-clamp-3">
                {item.error}
              </div>
            </div>
          ) : null}

          {item.status === 'cancelled' ? (
            <div className="h-full p-2">
              <TaskStatusBadge status={item.status} />
            </div>
          ) : null}

          {item.status === 'pending' || item.status === 'running' ? (
            <div className="w-full relative flex flex-col items-center justify-around">
              <AspectRatio
                ratio={(item.args.width || 1024) / (item.args.height || 1024)}
              >
                <Skeleton className="w-full h-full rounded-t-none rounded-bl-lg rounded-br-lg" />
              </AspectRatio>
              <div className="absolute flex items-center justify-center gap-2 inset-0 text-center self-center text-sm text-muted-foreground">
                <TaskStatusBadge
                  status={item.status}
                  hideText={true}
                  outputType={outputType}
                />
                {item.status === 'pending'
                  ? 'Waiting to start...'
                  : `Generating ${outputType}... `}
              </div>
              <Button
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
                outputType={outputType}
                key={`${item._id}_${index}`}
                index={index}
                task={item}
                result={result}
              />
            ))
          ) : item.model !== undefined ? (
            // task result is ObjectId of model document
            // api populates a model property with full model document
            <TimelineItemModelResult
              result={item.result[0]}
              outputType={outputType}
              task={item}
              model={item.model as unknown as ModelV2}
            />
          ) : (
            <div className="text-warning">
              Unhandled result: {item.workflow} - {item._id}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TimelineItem
