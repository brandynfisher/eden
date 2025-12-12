'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import TaskFormModal from '@/features/sessions/components/task-form-modal'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { Agent, Trigger } from '@edenlabs/eden-sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  AlertCircle,
  ChevronDownIcon,
  ClockIcon,
  EditIcon,
  Eye,
  Loader2,
  PlayIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useMemo, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

interface TriggerWithLastRun extends Trigger {
  last_run_time?: Date
}

const TaskItem: FC<{
  trigger: TriggerWithLastRun
  onEdit: (trigger: TriggerWithLastRun) => void
  onDelete: (triggerId: string) => void
  isFinished?: boolean
  timezone: string
}> = ({ trigger, onEdit, onDelete, isFinished = false, timezone }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const router = useRouter()

  const scheduleDescription = useMemo(() => {
    if (!trigger.schedule) return 'No schedule configured'
    const scheduleWithTimezone = {
      ...trigger.schedule,
      timezone: timezone,
    }
    return formatCronSchedule(scheduleWithTimezone)
  }, [trigger.schedule, timezone])

  const nextRunDisplay = useMemo(() => {
    if (trigger.next_scheduled_run) {
      const zonedTime = dayjs(trigger.next_scheduled_run).tz(timezone)
      return zonedTime.format('MMM D [at] h:mma')
    }
    return scheduleDescription
  }, [trigger.next_scheduled_run, timezone, scheduleDescription])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/triggers/${trigger._id}`)
      onDelete(trigger._id)
      toast.success('Task deleted successfully')
    } catch (error) {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExecuteNow = async () => {
    setIsExecuting(true)
    try {
      const response = await axios.post('/api/triggers/run', {
        trigger_id: trigger._id,
      })

      if (response.data.executed) {
        toast.success('Task started successfully', {
          description: 'Your task is now running',
        })
      } else {
        toast.error('Failed to start task', {
          description: 'Task could not be executed at this time',
        })
      }
    } catch (error) {
      toast.error('Failed to trigger task', {
        description: 'There was an error starting the task',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const formatLastRunTime = (lastRunTime?: Date) => {
    if (!lastRunTime) return 'Never run'

    const date = new Date(lastRunTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
      } else {
        return 'Just now'
      }
    }
  }

  return (
    <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {trigger.name || trigger.prompt}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {nextRunDisplay}
          </div>
          {!isFinished && (
            <div className="text-xs text-muted-foreground mt-1">
              Last run: {formatLastRunTime(trigger.last_run_time)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Run Now button - only for active tasks */}
        {!isFinished && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExecuteNow}
            disabled={isExecuting}
            className="h-8 w-8 p-0"
            title="Run task now"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* View session button - for all tasks */}
        {trigger.session && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const sessionId =
                typeof trigger.session === 'string'
                  ? trigger.session
                  : trigger.session._id
              router.push(`/sessions/${sessionId}`)
            }}
            className="h-8 w-8 p-0"
            title="View session where results are routed"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {/* Edit and Delete buttons - only for active tasks */}
        {!isFinished && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(trigger)}
            className="h-8 w-8 p-0"
            title="Edit task"
          >
            <EditIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Delete button - available for all tasks */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-destructive"
          title="Delete task"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
interface AgentTasksViewProps {
  agent: Agent
  variant?: 'standalone' | 'panel'
}

const AgentTasksView: FC<AgentTasksViewProps> = ({
  agent,
  variant = 'standalone',
}) => {
  const userTimezone = useMemo(() => {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
    return 'UTC'
  }, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TriggerWithLastRun | null>(
    null,
  )
  const [showFinished, setShowFinished] = useState(false)
  const tasksGate = useGatedResource(GatedResource.Tasks, {
    lockedBehavior: 'modal',
  })

  const triggersQuery = useUserTriggersQuery({
    enabled: tasksGate.isAllowed && !isModalOpen, // Disable refetching while modal is open or gated
  })

  const { activeTriggers, finishedTriggers } = useMemo(() => {
    const allTriggers = triggersQuery.triggers || []

    const finished = allTriggers.filter(trigger => {
      // Check if trigger has status 'finished'
      if (trigger.status === 'finished') {
        return true
      }

      // Also check if trigger has an end_date that has passed
      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate <= currentDate
      }

      return false
    })

    const active = allTriggers.filter(trigger => {
      // Check if trigger has status 'finished'
      if (trigger.status === 'finished') {
        return false
      }

      // Also check if trigger has an end_date that has passed
      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate > currentDate
      }

      return true
    })

    // Sort both arrays by next_scheduled_run (earliest first)
    const sortByNextRun = (a: TriggerWithLastRun, b: TriggerWithLastRun) => {
      // If neither has next_scheduled_run, fall back to updatedAt/createdAt
      if (!a.next_scheduled_run && !b.next_scheduled_run) {
        const aDate = new Date(a.updatedAt || a.createdAt)
        const bDate = new Date(b.updatedAt || b.createdAt)
        return bDate.getTime() - aDate.getTime()
      }

      // If only a has no next_scheduled_run, put it last
      if (!a.next_scheduled_run) return 1
      // If only b has no next_scheduled_run, put it last
      if (!b.next_scheduled_run) return -1

      // Both have next_scheduled_run, sort by earliest first (ascending)
      const aNextRun = new Date(a.next_scheduled_run).getTime()
      const bNextRun = new Date(b.next_scheduled_run).getTime()
      return aNextRun - bNextRun
    }

    return {
      activeTriggers: active.sort(sortByNextRun),
      finishedTriggers: finished.sort(sortByNextRun),
    }
  }, [triggersQuery.triggers])

  const handleCreateNew = () => {
    if (!tasksGate.isAllowed) {
      tasksGate.openGate()
      return
    }
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEdit = (trigger: Trigger) => {
    setEditingTask(trigger)
    setIsModalOpen(true)
  }

  const handleSave = () => {
    setEditingTask(null)
  }

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }

  const handleDelete = () => {
    triggersQuery.invalidate()
  }

  const isPanelLayout = variant === 'panel'
  const outerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'flex-1 overflow-auto bg-accent'
  const innerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'w-full max-w-4xl mx-auto px-4 py-6 space-y-6'
  const showInternalHeader = variant === 'standalone'

  return (
    <div className={outerWrapperClass}>
      <div className={innerWrapperClass}>
        {/* Header */}
        {showInternalHeader && (
          <div
            className={`flex flex-col gap-2 ${
              isPanelLayout
                ? 'rounded-xl border border-border bg-card p-6'
                : 'mb-6'
            }`}
          >
            <div>
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <p className="text-muted-foreground">
                Schedule automated tasks for {agent.name}
              </p>
            </div>
          </div>
        )}

        {!tasksGate.isAllowed ? (
          <LockedFeatureBanner
            gate={tasksGate}
            title="Tasks are available on Basic and above"
            description="Automate your agents with scheduled tasks by upgrading your plan."
          />
        ) : (
          <>
            {/* Task Modal */}
            <TaskFormModal
              sessionId={
                typeof editingTask?.session === 'string'
                  ? editingTask.session
                  : editingTask?.session?._id
              }
              editingTask={editingTask}
              open={isModalOpen}
              onOpenChange={handleModalClose}
              onSave={handleSave}
            />

            {/* Tasks List */}
            <div className="space-y-6">
              {/* Active Tasks */}
              <div className="rounded-xl border border-border bg-card">
                <div className="p-4 border-b flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold">Active Tasks</h3>
                  {tasksGate.isAllowed && (
                    <Button
                      onClick={handleCreateNew}
                      className="gap-2 w-full sm:w-auto"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create Task
                    </Button>
                  )}
                </div>
                {triggersQuery.isPending ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : triggersQuery.isError ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <p>Failed to load tasks. Please try again later.</p>
                  </div>
                ) : activeTriggers.length === 0 &&
                  finishedTriggers.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No scheduled tasks
                    </p>
                    <p className="text-sm">
                      Create your first automated task to get started.
                    </p>
                  </div>
                ) : activeTriggers.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p className="text-sm">No active tasks</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activeTriggers.map(trigger => (
                      <TaskItem
                        key={trigger._id}
                        trigger={trigger}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isFinished={false}
                        timezone={userTimezone}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Finished Tasks - Collapsible Section */}
              {!triggersQuery.isPending &&
                !triggersQuery.isError &&
                finishedTriggers.length > 0 && (
                  <div className="rounded-xl border border-border bg-card">
                    <Collapsible
                      open={showFinished}
                      onOpenChange={setShowFinished}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                              Finished Tasks ({finishedTriggers.length})
                            </h3>
                            <ChevronDownIcon
                              className={`h-4 w-4 transition-transform ${
                                showFinished ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="divide-y">
                          {finishedTriggers.map(trigger => (
                            <TaskItem
                              key={trigger._id}
                              trigger={trigger}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              isFinished={true}
                              timezone={userTimezone}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AgentTasksView
