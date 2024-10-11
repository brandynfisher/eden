import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskActionsMenu from '@/components/button/task-actions-menu'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import TimelineItemMediaResult from '@/components/timeline/timeline-item-media-result'
import TimelineItemModelResult from '@/components/timeline/timeline-item-model-result'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { TaskV2, TaskV2Status } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  item: TaskV2
  queryKey: QueryKey
}

const TimelineItem = ({ item, queryKey }: Props) => {
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
    <div
      data-test-id="timeline-item"
      key={item._id}
      className=" rounded-b-lg overflow-hidden"
    >
      <TaskParameterList task={item} />
      <div
        className={cn([
          'grid gap-1 px-1 h-fit my-auto grid-cols-2 xl:grid-cols-4 bg-muted-darker',
          item.args.n_samples && item.args.n_samples > 2
            ? 'xl:grid-cols-4'
            : '',
        ])}
      >
        {item.status !== TaskV2Status.Completed ? (
          <>
            {item.status === 'failed' ? (
              <div className="h-full p-2 bg-accent">
                <TaskStatusBadge status={item.status} />
                <div className="mt-1 text-muted-foreground text-sm line-clamp-3">
                  {item.error}
                </div>
              </div>
            ) : null}

            {item.status === 'cancelled' ? (
              <div className="h-full p-2 bg-accent">
                <TaskStatusBadge status={item.status} />
              </div>
            ) : null}
          </>
        ) : null}

        {item.status === 'pending' || item.status === 'running' ? (
          <>
            {[...Array(item.args.n_samples || 1)].map((_e, i) => (
              <div
                key={i}
                className="w-full relative flex flex-col items-center justify-around"
              >
                <AspectRatio
                  className="bg-popover/50 rounded-md overflow-hidden"
                  ratio={(item.args.width || 1024) / (item.args.height || 1024)}
                />
                <div className="absolute flex flex-col md:flex-row items-center justify-center gap-2 inset-0 text-center self-center text-sm text-muted-foreground animate-pulse">
                  <TaskStatusBadge
                    status={item.status}
                    hideText={true}
                    outputType={item.output_type}
                  />
                  {item.status === 'pending'
                    ? 'Waiting to start...'
                    : `Generating ${item.output_type}... `}
                </div>
              </div>
            ))}
          </>
        ) : null}

        {item.status === 'completed' ? (
          item.result && Array.isArray(item.result) ? (
            item.result.map((result, index) =>
              result.model === undefined ? (
                <TimelineItemMediaResult
                  queryKey={queryKey}
                  key={`${item._id}_${index}`}
                  index={index}
                  task={item}
                  result={result}
                />
              ) : (
                // api populates a model property with full model document
                <TimelineItemModelResult
                  queryKey={queryKey}
                  key={`${item._id}_${index}`}
                  index={index}
                  result={result}
                  task={item}
                />
              ),
            )
          ) : (
            <div className="text-warning">
              Unhandled result: {item.workflow} - {item._id}
            </div>
          )
        ) : null}
      </div>

      {item.status !== TaskV2Status.Completed ? (
        <div className="flex justify-between p-2 items-center bg-muted-darker rounded-b-lg overflow-hidden">
          {item.status === TaskV2Status.Pending ||
          item.status === TaskV2Status.Running ? (
            <Button
              variant="outline"
              type="button"
              className="px-2 py-0 h-6 text-warning/40 text-xs bg-popover/40 hover:bg-popover/70"
              onClick={() => handleCancel(item._id)}
              disabled={isCancelling}
            >
              Cancel Task
            </Button>
          ) : null}
          <TaskActionsMenu task={item} className="ml-auto" />
        </div>
      ) : null}
    </div>
  )
}

export default TimelineItem
