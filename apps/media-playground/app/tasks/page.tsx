'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { useAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import TaskFormModal from '@/features/sessions/components/task-form-modal'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { Trigger } from '@edenlabs/eden-sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  AlertCircle,
  ChevronDownIcon,
  ClockIcon,
  EditIcon,
  Loader2,
  MenuIcon,
  PlayIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

const TaskItem: FC<{
  trigger: Trigger
  onEdit: (trigger: Trigger) => void
  onDelete: (triggerId: string) => void
  isFinished?: boolean
  timezone: string
}> = ({ trigger, onEdit, onDelete, isFinished = false, timezone }) => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

        {/* Edit button - only for active tasks */}
        {!isFinished && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(trigger)}
            className="h-8 w-8 p-0"
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

const TasksPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const { isLoading: isAuthLoading } = useAuthState()
  const userTimezone = useMemo(() => {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
    return 'UTC'
  }, [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)
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
      if (trigger.status === 'finished') {
        return true
      }

      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate <= currentDate
      }

      return false
    })

    const active = allTriggers.filter(trigger => {
      if (trigger.status === 'finished') {
        return false
      }

      if (trigger.schedule?.end_date) {
        const endDate = new Date(trigger.schedule.end_date)
        const currentDate = new Date()
        return endDate > currentDate
      }

      return true
    })

    const sortByNextRun = (a: Trigger, b: Trigger) => {
      if (!a.next_scheduled_run && !b.next_scheduled_run) {
        const aDate = new Date(a.updatedAt || a.createdAt)
        const bDate = new Date(b.updatedAt || b.createdAt)
        return bDate.getTime() - aDate.getTime()
      }

      if (!a.next_scheduled_run) return 1
      if (!b.next_scheduled_run) return -1

      const aNextRun = new Date(a.next_scheduled_run).getTime()
      const bNextRun = new Date(b.next_scheduled_run).getTime()
      return aNextRun - bNextRun
    }

    return {
      activeTriggers: active.sort(sortByNextRun),
      finishedTriggers: finished.sort(sortByNextRun),
    }
  }, [triggersQuery.triggers])

  const handleCreateNew = useCallback(() => {
    if (!tasksGate.isAllowed) {
      tasksGate.openGate()
      return
    }
    setEditingTask(null)
    setIsModalOpen(true)
  }, [tasksGate])

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

  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
            }}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-semibold">Tasks</span>
          </button>
          <button
            onClick={() => {
              close()
              handleCreateNew()
            }}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="New Task"
          >
            <PlusIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  if (isAuthLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Tasks</h1>
        {tasksGate.isAllowed && (
          <div className="ml-auto">
            <button
              onClick={handleCreateNew}
              className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
              aria-label="New task"
            >
              <PlusIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="w-full max-w-4xl mx-auto px-4 py-6 flex-1 min-h-0">
          {/* Header (desktop only to avoid duplicate hero on mobile) */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <p className="text-muted-foreground">
                Schedule automated tasks for all your agents
              </p>
            </div>
            {tasksGate.isAllowed && (
              <Button onClick={handleCreateNew} className="gap-2">
                <PlusIcon className="w-4 h-4" />
                Create Task
              </Button>
            )}
          </div>

          {!tasksGate.isAllowed ? (
            <LockedFeatureBanner
              gate={tasksGate}
              title="Tasks are available on Basic and above"
              description="Automate your agents with scheduled tasks by upgrading your plan."
            />
          ) : (
            <>
              {/* Tasks List */}
              <div className="space-y-6">
                {triggersQuery.isPending ? (
                  <div className="bg-background rounded-lg border">
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  </div>
                ) : triggersQuery.isError ? (
                  <div className="bg-background rounded-lg border">
                    <div className="flex items-center justify-center gap-2 p-8 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      <p>Failed to load tasks. Please try again later.</p>
                    </div>
                  </div>
                ) : activeTriggers.length === 0 &&
                  finishedTriggers.length === 0 ? (
                  <div className="bg-background rounded-lg border">
                    <div className="text-center p-8 text-muted-foreground">
                      <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        No scheduled tasks
                      </p>
                      <p className="text-sm">
                        Create your first automated task to get started.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active Tasks */}
                    <div className="bg-background rounded-lg border">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold">Active Tasks</h3>
                      </div>
                      {activeTriggers.length === 0 ? (
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
                    {finishedTriggers.length > 0 && (
                      <div className="bg-background rounded-lg border">
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
                  </>
                )}
              </div>

              {/* Task Modal */}
              <TaskFormModal
                editingTask={editingTask}
                open={isModalOpen}
                onOpenChange={handleModalClose}
                onSave={handleSave}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TasksPage
