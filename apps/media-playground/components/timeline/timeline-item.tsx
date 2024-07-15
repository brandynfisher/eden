import TaskStatusBadge from '@/components/badge/task-status-badge'
import TaskParameterList from '@/components/timeline/task-parameter-list'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { useAuthState } from '@/hooks/use-auth-state'
import { downloadFile, getDownloadFileName } from '@/lib/files'
import { TaskV2 } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import { DownloadIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useState } from 'react'

type Props = {
  item: TaskV2
}

const TimelineItem = ({ item }: Props) => {
  const { verifyAuth } = useAuthState()
  const { toast } = useToast()

  const [isCancelling, setIsCancelling] = useState(false)

  // const handleCancel = async (taskId: TaskV2['_id']) => {
  //   setIsCancelling(true)
  //   console.log('try cancel', taskId)
  // setTimeout(() => {
  // setIsCancelling(false)
  // }, 1000)
  // }
  const handleCancel = useCallback(async (taskId: TaskV2['_id']) => {
    console.log('try cancel', taskId)
    if (!(await verifyAuth())) {
      return
    }

    console.log('onCancel', taskId)
    setIsCancelling(true)

    try {
      const response = await axios.post('/api/tasks/cancel', {
        taskId,
      })

      console.log({ response })
      console.log(response.data)

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
          {item.status === 'completed' && item.result && item.result.length
            ? item.result.map(result => (
                <div key={`${item._id}_${result}`}>
                  <div className="relative border-transparent bg-popover">
                    {result.startsWith('http') ? (
                      <>
                        {result.endsWith('.mp4') ? (
                          <video
                            src={result}
                            loop={true}
                            controls={true}
                            controlsList={'nodownload'}
                            onContextMenu={(e: React.MouseEvent) =>
                              e.preventDefault()
                            }
                            className="w-full rounded-bl-lg rounded-br-lg"
                          />
                        ) : (
                          <Image
                            src={result}
                            alt={result}
                            // fill={true}
                            objectFit={'cover'}
                            width={item.args.width || 1024}
                            height={item.args.height || 1024}
                            className="object-cover w-full rounded-bl-lg rounded-br-lg"
                          />
                        )}
                      </>
                    ) : (
                      // result is model / concept
                      // @todo: fetch model data by it's id or pre-populate this api-side for a successful task
                      <>concept: {result}</>
                    )}
                  </div>
                  {/* //@todo: extract tool button/s to re-usable components */}
                  <div className="mt-2">
                    {/*// @todo: show toast 'Downloading file...' to indicate something is happening */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Download"
                      onClick={() =>
                        downloadFile(
                          result,
                          getDownloadFileName(
                            item.user,
                            item._id,
                            item.args?.prompt,
                          ),
                        )
                      }
                    >
                      <DownloadIcon size={20} />
                    </Button>
                  </div>
                </div>
              ))
            : null}
        </div>
      )}
    </div>
  )
}

export default TimelineItem
