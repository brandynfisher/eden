'use client'

import { TaskForm } from './task-form'
import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { cn } from '@/lib/utils'
import { Trigger, TriggerRun } from '@edenlabs/eden-sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  AlertCircle,
  ArchiveIcon,
  ChevronRightIcon,
  ClockIcon,
  HistoryIcon,
  Loader2,
  MoreVerticalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)
dayjs.extend(relativeTime)

type TasksTabProps = {
  isModalOpen: boolean
  sessionId?: string // Filter tasks by this session
  onTasksChange?: () => void // Called when tasks are modified
  onNavigateToMessage?: (messageId: string) => void // Navigate to a specific message in the session
}

const RunHistoryItem: FC<{
  run: TriggerRun
  onNavigate?: (messageId: string) => void
}> = ({ run, onNavigate }) => {
  const ranAt = dayjs(run.ran_at)
  const relativeTime = ranAt.fromNow()
  const fullTime = ranAt.format('MMM D, YYYY [at] h:mm A')

  return (
    <button
      onClick={() => onNavigate?.(run.message_id)}
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors group/run"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover/run:bg-primary transition-colors" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground group-hover/run:text-foreground transition-colors">
          {relativeTime}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover/run:opacity-100 transition-opacity">
        {fullTime}
      </span>
      <ChevronRightIcon className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover/run:opacity-100 transition-opacity" />
    </button>
  )
}

const TaskItem: FC<{
  trigger: Trigger
  onEdit: (trigger: Trigger) => void
  onArchive: (triggerId: string) => void
  onReactivate: (triggerId: string) => void
  onPause: (triggerId: string) => void
  onResume: (triggerId: string) => void
  onDelete: (triggerId: string) => void
  onRunComplete?: (triggerId: string) => void
  onNavigateToMessage?: (messageId: string) => void
  onNavigateToLatest?: () => void
  isFinished?: boolean
  timezone: string
}> = ({
  trigger,
  onEdit,
  onArchive,
  onReactivate,
  onPause,
  onResume,
  onDelete,
  onRunComplete,
  onNavigateToMessage,
  onNavigateToLatest,
  isFinished = false,
  timezone,
}) => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRuns, setShowRuns] = useState(false)

  const scheduleDisplay = useMemo(() => {
    if (!trigger.schedule) return null

    // Show "Paused" for paused tasks
    if (trigger.status === 'paused') {
      return 'Paused'
    }

    const scheduleWithTimezone = {
      ...trigger.schedule,
      timezone: timezone,
    }
    const description = formatCronSchedule(scheduleWithTimezone)

    // Show next run time if available
    if (trigger.next_scheduled_run) {
      const zonedTime = dayjs(trigger.next_scheduled_run).tz(timezone)
      const now = dayjs().tz(timezone)
      const tomorrow = now.add(1, 'day')

      // Check if it's today or tomorrow
      let dateStr: string
      if (zonedTime.isSame(now, 'day')) {
        dateStr = 'Today'
      } else if (zonedTime.isSame(tomorrow, 'day')) {
        dateStr = 'Tomorrow'
      } else {
        dateStr = zonedTime.format('MMM D')
      }

      return `Next: ${dateStr} at ${zonedTime.format('h:mma')}`
    }

    return description
  }, [trigger.schedule, trigger.next_scheduled_run, trigger.status, timezone])

  const runs = useMemo(() => {
    return (trigger.runs || []).slice().reverse() // Most recent first
  }, [trigger.runs])

  const handleExecuteNow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExecuting(true)
    try {
      const response = await axios.post('/api/triggers/run', {
        trigger_id: trigger._id,
      })

      if (response.data.executed) {
        toast.success('Task started', {
          description: 'Running now',
          action: onNavigateToLatest
            ? {
                label: 'View',
                onClick: onNavigateToLatest,
              }
            : undefined,
        })
        onRunComplete?.(trigger._id)
      } else {
        toast.error('Failed to start task')
      }
    } catch {
      toast.error('Failed to run task')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      await axios.patch(`/api/triggers/${trigger._id}`, { status: 'finished' })
      onArchive(trigger._id)
      toast.success('Task archived')
    } catch {
      toast.error('Failed to archive task')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleReactivate = async () => {
    setIsReactivating(true)
    try {
      await axios.patch(`/api/triggers/${trigger._id}`, { status: 'active' })
      onReactivate(trigger._id)
      toast.success('Task reactivated')
    } catch {
      toast.error('Failed to reactivate task')
    } finally {
      setIsReactivating(false)
    }
  }

  const handlePause = async () => {
    setIsPausing(true)
    try {
      await axios.patch(`/api/triggers/${trigger._id}`, { status: 'paused' })
      onPause(trigger._id)
      toast.success('Schedule paused')
    } catch {
      toast.error('Failed to pause schedule')
    } finally {
      setIsPausing(false)
    }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      await axios.patch(`/api/triggers/${trigger._id}`, { status: 'active' })
      onResume(trigger._id)
      toast.success('Schedule resumed')
    } catch {
      toast.error('Failed to resume schedule')
    } finally {
      setIsResuming(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/triggers/${trigger._id}`)
      onDelete(trigger._id)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Play Button - Prominent */}
        {!isFinished && (
          <button
            onClick={handleExecuteNow}
            disabled={isExecuting}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
              'bg-primary/10 hover:bg-primary/20 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            title="Run now"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <PlayIcon className="h-4 w-4 text-primary fill-primary" />
            )}
          </button>
        )}

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {trigger.name || trigger.prompt}
          </div>
          {scheduleDisplay && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <ClockIcon className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">
                {scheduleDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Runs Toggle Button */}
        {runs.length > 0 && (
          <button
            onClick={() => setShowRuns(!showRuns)}
            className={cn(
              'h-7 px-2 rounded-md text-xs flex items-center gap-1.5 transition-colors',
              showRuns
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>{runs.length}</span>
          </button>
        )}

        {/* Context Menu - Different options for active vs archived */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!isFinished ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(trigger)}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {/* Pause/Resume for scheduled tasks */}
                {trigger.schedule && (
                  <>
                    <DropdownMenuSeparator />
                    {trigger.status === 'paused' ? (
                      <DropdownMenuItem
                        onClick={handleResume}
                        disabled={isResuming}
                      >
                        {isResuming ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <PlayIcon className="h-4 w-4 mr-2" />
                        )}
                        Resume schedule
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={handlePause}
                        disabled={isPausing}
                      >
                        {isPausing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <PauseIcon className="h-4 w-4 mr-2" />
                        )}
                        Pause schedule
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  {isArchiving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                  )}
                  Archive
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={handleReactivate}
                  disabled={isReactivating}
                >
                  {isReactivating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcwIcon className="h-4 w-4 mr-2" />
                  )}
                  Reactivate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2Icon className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expandable Run History */}
      {showRuns && runs.length > 0 && (
        <div className="px-4 pb-2">
          <div className="ml-[52px] pl-3 border-l border-muted">
            <div className="max-h-[180px] overflow-y-auto -space-y-0.5">
              {runs.map((run, index) => (
                <RunHistoryItem
                  key={`${run.message_id}-${index}`}
                  run={run}
                  onNavigate={onNavigateToMessage}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Recent run item for the consolidated recent runs section
type RecentRunItem = {
  trigger: Trigger
  run: TriggerRun
}

export const TasksTab = ({
  isModalOpen,
  sessionId,
  onTasksChange,
  onNavigateToMessage,
}: TasksTabProps) => {
  const userTimezone = useMemo(() => {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
    return 'UTC'
  }, [])

  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active')
  const [pendingRuns, setPendingRuns] = useState<RecentRunItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)

  const tasksGate = useGatedResource(GatedResource.Tasks, {
    lockedBehavior: 'modal',
  })

  const triggersQuery = useUserTriggersQuery({
    enabled: tasksGate.isAllowed && isModalOpen,
  })

  const { manualTriggers, scheduledTriggers, archivedTriggers, recentRuns } =
    useMemo(() => {
      const allTriggers = (triggersQuery.triggers || []) as Trigger[]

      // Filter by session if sessionId is provided
      const sessionTriggers = sessionId
        ? allTriggers.filter(trigger => {
            const triggerSessionId =
              typeof trigger.session === 'object' && trigger.session !== null
                ? (trigger.session as { _id: string })._id
                : trigger.session
            return triggerSessionId === sessionId
          })
        : allTriggers

      const archived = sessionTriggers.filter(trigger => {
        // Explicitly marked as finished
        if (trigger.status === 'finished') {
          return true
        }

        // Tasks without schedules never become archived
        if (!trigger.schedule) {
          return false
        }

        // Tasks with schedules that have ended are archived
        if (trigger.schedule.end_date) {
          const endDate = new Date(trigger.schedule.end_date)
          const currentDate = new Date()
          return endDate <= currentDate
        }

        return false
      })

      const active = sessionTriggers.filter(trigger => {
        // Finished tasks are archived
        if (trigger.status === 'finished') {
          return false
        }

        // Manual tasks (no schedule) are always active unless finished
        if (!trigger.schedule) {
          return true
        }

        // Scheduled tasks: include active AND paused (paused shows under Scheduled)
        if (trigger.status === 'active' || trigger.status === 'paused') {
          // Check if schedule has ended
          if (trigger.schedule.end_date) {
            const endDate = new Date(trigger.schedule.end_date)
            const currentDate = new Date()
            return endDate > currentDate
          }
          return true
        }

        return false
      })

      // Split active into manual (no schedule) and scheduled (with schedule, including paused)
      const manual = active.filter(trigger => !trigger.schedule)
      const scheduled = active.filter(trigger => !!trigger.schedule)

      const sortByUpdated = (a: Trigger, b: Trigger) => {
        const aDate = new Date(a.updatedAt || a.createdAt)
        const bDate = new Date(b.updatedAt || b.createdAt)
        return bDate.getTime() - aDate.getTime()
      }

      const sortByNextRun = (a: Trigger, b: Trigger) => {
        if (!a.next_scheduled_run && !b.next_scheduled_run) {
          return sortByUpdated(a, b)
        }

        if (!a.next_scheduled_run) return 1
        if (!b.next_scheduled_run) return -1

        const aNextRun = new Date(a.next_scheduled_run).getTime()
        const bNextRun = new Date(b.next_scheduled_run).getTime()
        return aNextRun - bNextRun
      }

      // Collect all runs from all triggers and sort by most recent
      const allRuns: RecentRunItem[] = []
      sessionTriggers.forEach(trigger => {
        if (trigger.runs) {
          trigger.runs.forEach(run => {
            allRuns.push({ trigger, run })
          })
        }
      })
      allRuns.sort(
        (a, b) =>
          new Date(b.run.ran_at).getTime() - new Date(a.run.ran_at).getTime(),
      )

      return {
        manualTriggers: manual.sort(sortByUpdated),
        scheduledTriggers: scheduled.sort(sortByNextRun),
        archivedTriggers: archived.sort(sortByNextRun),
        recentRuns: allRuns.slice(0, 10), // Show last 10 runs
      }
    }, [triggersQuery.triggers, sessionId])

  // Combine pending runs with actual runs, filtering out duplicates
  const combinedRecentRuns = useMemo(() => {
    const actualRunIds = new Set(recentRuns.map(r => r.run.message_id))
    const uniquePendingRuns = pendingRuns.filter(
      pr => !actualRunIds.has(pr.run.message_id),
    )
    return [...uniquePendingRuns, ...recentRuns].slice(0, 10)
  }, [recentRuns, pendingRuns])

  // Handle run completion - add optimistic update
  const handleRunComplete = useCallback(
    (triggerId: string) => {
      const allActive = [...manualTriggers, ...scheduledTriggers]
      const trigger = allActive.find(t => t._id === triggerId)
      if (trigger) {
        // Add optimistic pending run
        const pendingRun: RecentRunItem = {
          trigger,
          run: {
            message_id: `pending-${Date.now()}`,
            ran_at: new Date(),
          },
        }
        setPendingRuns(prev => [pendingRun, ...prev])
      }
      // Invalidate to fetch real data
      triggersQuery.invalidate()
      onTasksChange?.()

      // Clear pending runs after a delay (when real data arrives)
      setTimeout(() => {
        setPendingRuns([])
      }, 3000)
    },
    [manualTriggers, scheduledTriggers, triggersQuery, onTasksChange],
  )

  // Navigate to latest message (scroll to bottom of chat)
  const handleNavigateToLatest = useCallback(() => {
    // This will be passed down - parent component handles actual navigation
    // For now, if we have recent runs, navigate to the most recent
    if (
      combinedRecentRuns.length > 0 &&
      !combinedRecentRuns[0].run.message_id.startsWith('pending-')
    ) {
      onNavigateToMessage?.(combinedRecentRuns[0].run.message_id)
    }
  }, [combinedRecentRuns, onNavigateToMessage])

  const handleCreateNew = useCallback(() => {
    if (!tasksGate.isAllowed) {
      tasksGate.openGate()
      return
    }
    setEditingTask(null)
    setShowForm(true)
  }, [tasksGate])

  const handleEdit = (trigger: Trigger) => {
    setEditingTask(trigger)
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const handleFormSave = () => {
    setShowForm(false)
    setEditingTask(null)
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  const handleArchive = () => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  const handleReactivate = () => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  const handlePause = () => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  const handleResume = () => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  const handleDelete = () => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }

  if (!tasksGate.isAllowed) {
    return (
      <LockedFeatureBanner
        gate={tasksGate}
        title="Tasks are available on Basic and above"
        description="Automate your agents with scheduled tasks by upgrading your plan."
      />
    )
  }

  // Show inline form when creating or editing
  if (showForm) {
    return (
      <TaskForm
        sessionId={sessionId}
        editingTask={editingTask}
        onCancel={handleFormCancel}
        onSave={handleFormSave}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Tabs and Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'archive'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Archive
            {archivedTriggers.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({archivedTriggers.length})
              </span>
            )}
          </button>
        </div>
        <Button onClick={handleCreateNew} size="sm" className="gap-2">
          <PlusIcon className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* Tasks Content */}
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
      ) : activeTab === 'active' ? (
        <>
          {/* Empty state when no tasks at all */}
          {manualTriggers.length === 0 && scheduledTriggers.length === 0 ? (
            <div className="bg-background rounded-lg border">
              <div className="text-center p-8 text-muted-foreground">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No active tasks</p>
                <p className="text-sm">Schedule tasks for this session.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Manual Tasks (no schedule) */}
              {manualTriggers.length > 0 && (
                <div className="bg-background rounded-lg border divide-y">
                  {manualTriggers.map(trigger => (
                    <TaskItem
                      key={trigger._id}
                      trigger={trigger}
                      onEdit={handleEdit}
                      onArchive={handleArchive}
                      onReactivate={handleReactivate}
                      onPause={handlePause}
                      onResume={handleResume}
                      onDelete={handleDelete}
                      onRunComplete={handleRunComplete}
                      onNavigateToMessage={onNavigateToMessage}
                      onNavigateToLatest={handleNavigateToLatest}
                      isFinished={false}
                      timezone={userTimezone}
                    />
                  ))}
                </div>
              )}

              {/* Scheduled Tasks (with schedule, including paused) */}
              {scheduledTriggers.length > 0 && (
                <div>
                  <div className="mb-2 px-1">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                      Scheduled
                    </span>
                  </div>
                  <div className="bg-background rounded-lg border divide-y">
                    {scheduledTriggers.map(trigger => (
                      <TaskItem
                        key={trigger._id}
                        trigger={trigger}
                        onEdit={handleEdit}
                        onArchive={handleArchive}
                        onReactivate={handleReactivate}
                        onPause={handlePause}
                        onResume={handleResume}
                        onDelete={handleDelete}
                        onRunComplete={handleRunComplete}
                        onNavigateToMessage={onNavigateToMessage}
                        onNavigateToLatest={handleNavigateToLatest}
                        isFinished={false}
                        timezone={userTimezone}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Section */}
          {combinedRecentRuns.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 px-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                  Recent
                </span>
              </div>
              <div className="space-y-0.5">
                {combinedRecentRuns.map((item, index) => {
                  const ranAt = dayjs(item.run.ran_at)
                  const isPending = item.run.message_id.startsWith('pending-')
                  return (
                    <button
                      key={`${item.run.message_id}-${index}`}
                      onClick={() =>
                        !isPending && onNavigateToMessage?.(item.run.message_id)
                      }
                      disabled={isPending}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg',
                        isPending
                          ? 'opacity-60 cursor-default'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      <div
                        className={cn(
                          'w-1 h-1 rounded-full',
                          isPending
                            ? 'bg-primary animate-pulse'
                            : 'bg-muted-foreground/30',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] truncate block text-foreground/80">
                          {item.trigger.name || item.trigger.prompt}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] tabular-nums',
                          isPending
                            ? 'text-primary/70'
                            : 'text-muted-foreground/50',
                        )}
                      >
                        {isPending ? 'Running...' : ranAt.fromNow()}
                      </span>
                      {!isPending && (
                        <ChevronRightIcon className="h-3 w-3 text-muted-foreground/30" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : /* Archive Tab */
      archivedTriggers.length === 0 ? (
        <div className="bg-background rounded-lg border">
          <div className="text-center p-8 text-muted-foreground">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No archived tasks</p>
            <p className="text-sm">
              Completed or expired tasks will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-background rounded-lg border divide-y">
          {archivedTriggers.map(trigger => (
            <TaskItem
              key={trigger._id}
              trigger={trigger}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onReactivate={handleReactivate}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
              onRunComplete={handleRunComplete}
              onNavigateToMessage={onNavigateToMessage}
              onNavigateToLatest={handleNavigateToLatest}
              isFinished={true}
              timezone={userTimezone}
            />
          ))}
        </div>
      )}
    </div>
  )
}
