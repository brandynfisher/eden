import AlertDestructive from '@/components/alert/alert-destructive'
import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskActionsMenu from '@/components/button/task-actions-menu'
import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery } from '@/components/media/lightbox'
import ParameterTableCollapsible from '@/components/timeline/parameter-table-collapsible'
import TimelineItemMediaResult from '@/components/timeline/timeline-item-media-result'
import TimelineItemModelResult from '@/components/timeline/timeline-item-model-result'
import LoraTrainingProgress from '@/components/training/lora-training-progress'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { TaskV2, TaskV2Status } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

type Props = {
  item: TaskV2
  queryKey: QueryKey
}

const PendingMediaPlaceholder = ({
  task,
  showStatus,
  pendingLabel,
}: {
  task: TaskV2
  showStatus: boolean
  pendingLabel: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current?.parentElement) {
        setContainerWidth(containerRef.current.parentElement.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const width = task.args?.width ?? 1024
  const height = task.args?.height ?? 1024
  const aspectRatio =
    (width && height ? width / height : undefined) ||
    (task.output_type === 'audio' ? 3 : 1)

  const maxHeight =
    typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600
  const availableWidth = containerWidth ?? 800

  let computedWidth = availableWidth
  let computedHeight = computedWidth / aspectRatio

  if (computedHeight > maxHeight) {
    computedHeight = maxHeight
    computedWidth = computedHeight * aspectRatio
  }

  if (computedWidth > availableWidth) {
    computedWidth = availableWidth
    computedHeight = computedWidth / aspectRatio
  }

  return (
    <div className="p-2 bg-secondary rounded-md overflow-hidden max-w-full">
      <div className="relative">
        <div
          ref={containerRef}
          className="relative bg-accent z-10 rounded-md mx-auto overflow-hidden"
          style={{
            width: computedWidth,
            height: computedHeight,
            maxWidth: '100%',
          }}
        >
          <Skeleton className="absolute inset-0 rounded-md border border-secondary/40 bg-muted/40" />
          {showStatus ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TaskStatusBadge
                  status={task.status}
                  hideText={true}
                  output_type={task.output_type}
                />
                <span>{pendingLabel}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
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

  const num_samples = (item.args?.n_samples ?? item.args?.num_outputs) || false
  const resultCount =
    item.result && Array.isArray(item.result) ? item.result.length : 0
  const expectedCount = num_samples || 1
  const pendingCount =
    item.status === TaskV2Status.Pending || item.status === TaskV2Status.Running
      ? Math.max(expectedCount - resultCount, 0)
      : 0
  const pendingLabel =
    item.status === TaskV2Status.Pending
      ? 'Waiting to start...'
      : item.output_type === 'lora'
      ? `Training ${item.output_type}... `
      : `Generating ${item.output_type}... `

  return (
    <div
      data-test-id="timeline-item"
      key={item._id}
      className={cn([
        `w-full border border-secondary p-0.5 md:p-2 rounded-lg overflow-hidden`,
      ])}
    >
      <ParameterTableCollapsible item={item} />
      <div className="flex items-center justify-center h-full w-full flex-grow">
        <div
          className={cn([
            'grid gap-4 w-full',
            'grid-cols-1 justify-items-center',
          ])}
          style={{ gridAutoRows: 'auto' }}
        >
          {pendingCount > 0 ? (
            <>
              {Array.from({ length: pendingCount }).map((_item, index) => (
                <PendingMediaPlaceholder
                  key={`${item._id}_pending_${index}`}
                  task={item}
                  showStatus={true}
                  pendingLabel={pendingLabel}
                />
              ))}
              {item.output_type === 'lora' && item.status === 'running' && (
                <LoraTrainingProgress
                  task={item}
                  maxTrainSteps={item.args?.max_train_steps || 200}
                />
              )}
            </>
          ) : null}

          <Suspense>
            <ErrorBoundary>
              <LightboxGallery>
                {item.result && Array.isArray(item.result) && item.result.length
                  ? item.result.map((result, index) =>
                      result.output && Array.isArray(result.output) ? (
                        item.output_type === 'lora' ? (
                          // api populates a model property with full model document
                          <TimelineItemModelResult
                            queryKey={queryKey}
                            key={`${item._id}_${index}`}
                            index={index}
                            result={result}
                            task={item}
                          />
                        ) : (
                          <TimelineItemMediaResult
                            queryKey={queryKey}
                            key={`${item._id}_${index}`}
                            index={index}
                            task={item}
                            result={result}
                          />
                        )
                      ) : (
                        <AlertDestructive key={index} title="Data Error">
                          <AlertDescription>Item: {item?._id}</AlertDescription>
                        </AlertDestructive>
                      ),
                    )
                  : null}
              </LightboxGallery>
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>

      {item.status !== TaskV2Status.Completed ? (
        <div className="flex justify-between items-center mt-2 h-9">
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
