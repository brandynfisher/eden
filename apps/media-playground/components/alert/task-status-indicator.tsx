'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import customImageLoader from '@/image-loader'
import { cn } from '@/lib/utils'
import { useTaskStatus } from '@/providers/task-status-provider'
import { useCreationDetailModalStore } from '@/zustand/creation-detail-modal-store'
import { TaskV2, TaskV2Status } from '@edenlabs/eden-sdk'
import {
  BanIcon,
  CircleCheckIcon,
  InboxIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Image from 'next/image'
import { useState } from 'react'

const TaskStatusIndicator = () => {
  const { isSignedIn } = useAuthState()
  const {
    allTasks,
    pendingRunningTasks,
    failedTasks,
    completedTasks,
    cancelledTasks,
  } = useTaskStatus()
  const [open, setOpen] = useState(false)
  const { TimeAgo } = useTimeAgo()
  const openCreationDetail = useCreationDetailModalStore(state => state.open)

  const hasAnyTaskSummary = [
    pendingRunningTasks?.length,
    completedTasks?.length,
    failedTasks?.length,
    cancelledTasks?.length,
  ].some(count => !!count)

  if (!isSignedIn) {
    return null
  }

  const getFirstCreationId = (task: TaskV2) => {
    if (!task.result) return null
    for (const result of task.result) {
      for (const output of result.output || []) {
        const creationId = output?.creation?._id
        if (creationId) {
          return creationId
        }
      }
    }
    return null
  }

  const handleTaskSelect = (task: TaskV2) => {
    const creationId = getFirstCreationId(task)
    if (!creationId) return
    openCreationDetail({ creationId })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger title="View recent tasks" asChild>
        <Button
          variant="ghost"
          className="flex px-2 gap-2 focus:!ring-0 relative"
        >
          {!hasAnyTaskSummary ? (
            <div className="flex items-center">
              <InboxIcon className="mr-1 h-4 w-4" />0
            </div>
          ) : (
            <>
              {pendingRunningTasks && pendingRunningTasks.length ? (
                <div className="flex items-center text-blue-500">
                  <span className={'mr-1 h-5 w-5 loading loading-ring'} />
                  <span className="text-sm">{pendingRunningTasks.length}</span>
                </div>
              ) : null}
              {completedTasks && completedTasks.length ? (
                <div className="flex items-center text-green-500">
                  <CircleCheckIcon className="mr-1 h-4 w-4" />
                  <span className="text-sm">{completedTasks.length}</span>
                </div>
              ) : null}
              {failedTasks && failedTasks.length ? (
                <div className="flex items-center text-red-500">
                  <TriangleAlertIcon className="mr-1 h-4 w-4" />
                  <span className="text-sm">{failedTasks.length}</span>
                </div>
              ) : null}
              {cancelledTasks && cancelledTasks.length ? (
                <div className="flex items-center text-yellow-500">
                  <BanIcon className="mr-1 h-4 w-4" />
                  <span className="text-sm">{cancelledTasks.length}</span>
                </div>
              ) : null}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-popover shadow-md rounded-md w-80">
        <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100dvh_-_240px)] md:max-h-[calc(100dvh_-_120px)]">
          {allTasks.length > 0 ? (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Tasks
            </div>
          ) : null}

          {allTasks.length === 0 ? (
            <DropdownMenuItem className="px-2 py-3 bg-muted/20 text-muted-foreground/50 hover:bg-muted rounded cursor-pointer">
              No recent tasks
            </DropdownMenuItem>
          ) : (
            allTasks.map(task => {
              const isInteractive =
                task.status === TaskV2Status.Completed &&
                Boolean(getFirstCreationId(task))

              return (
                <div key={task._id}>
                  <DropdownMenuItem
                    className={cn(
                      'px-2 py-2 rounded',
                      isInteractive
                        ? 'cursor-pointer hover:bg-muted'
                        : 'cursor-not-allowed opacity-60',
                    )}
                    disabled={!isInteractive}
                    onSelect={event => {
                      if (!isInteractive) {
                        event.preventDefault()
                        return
                      }
                      handleTaskSelect(task)
                    }}
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2 mb-1">
                        {task.status === null ||
                        task.status === TaskV2Status.Running ||
                        task.status === TaskV2Status.Pending ? (
                          <span
                            className={
                              'text-blue-500 mr-1 h-5 w-5 loading loading-ring'
                            }
                          />
                        ) : null}
                        {task.status === TaskV2Status.Completed ? (
                          <CircleCheckIcon className="text-green-500 h-4 w-4" />
                        ) : null}
                        {task.status === TaskV2Status.Cancelled ? (
                          <BanIcon className="text-yellow-500 h-4 w-4" />
                        ) : null}
                        {task.status === TaskV2Status.Failed ? (
                          <TriangleAlertIcon className="text-red-500 h-4 w-4" />
                        ) : null}
                        <div className="text-xs text-accent-foreground">
                          {task.tool || 'No tool'}
                        </div>
                        <div
                          className="text-xs text-muted-foreground/50 ml-auto"
                          title={new Date(task.createdAt).toLocaleString()}
                        >
                          <TimeAgo date={task.createdAt} locale="en-short" />
                        </div>
                      </div>
                      <div className={'h-10 flex gap-2 items-center relative'}>
                        {task.status === TaskV2Status.Completed
                          ? task.result.map((result, resultIndex) =>
                              result.output && Array.isArray(result.output) ? (
                                result.output.map((output, index) => (
                                  <Image
                                    key={`${task._id}_${index}_${output.filename}`}
                                    className="flex-shrink-0 max-h-8 w-8 rounded-md object-cover"
                                    loader={customImageLoader}
                                    src={output.filename || ''}
                                    alt={task.args.prompt || ''}
                                    width={48}
                                    height={48}
                                  />
                                ))
                              ) : (
                                <AlertDestructive key={resultIndex}>
                                  <AlertDescription className="p-1 text-xs">
                                    Item: {task?._id}
                                  </AlertDescription>
                                </AlertDestructive>
                              ),
                            )
                          : null}
                        <div className="text-xs line-clamp-2 text-muted-foreground">
                          {task.args?.prompt || '-'}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TaskStatusIndicator
