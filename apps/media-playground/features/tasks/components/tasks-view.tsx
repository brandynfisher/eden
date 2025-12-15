'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { TaskForm } from '@/features/sessions/components/session-settings-tabs/task-form'
import { TaskFormWithSelectors } from '@/features/tasks/components/task-form-with-selectors'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { cn } from '@/lib/utils'
import {
  Trigger,
  TriggerRun,
  TriggerSession,
  TriggerSessionAgent,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  AlertCircle,
  ArchiveIcon,
  ChevronLeftIcon,
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)
dayjs.extend(relativeTime)

// Types for filtering
export type TasksViewMode = 'global' | 'session' | 'agent'

export type TasksViewProps = {
  mode: TasksViewMode
  sessionId?: string // For session mode
  agentId?: string // For agent mode
  isModalOpen?: boolean // For controlling query fetching when in a modal
  onTasksChange?: () => void
  onNavigateToMessage?: (messageId: string) => void
  showHeader?: boolean
  headerTitle?: string
  headerDescription?: string
}

// Helper to extract session info from trigger
const getSessionInfo = (
  trigger: Trigger,
): { id: string; title: string; agents: TriggerSessionAgent[] } => {
  if (typeof trigger.session === 'string') {
    return { id: trigger.session, title: 'Session', agents: [] }
  }
  const session = trigger.session as TriggerSession
  return {
    id: session._id,
    title: session.title || 'Untitled Session',
    agents: session.agents || [],
  }
}

// Recent run item type
type RecentRunItem = {
  trigger: Trigger
  run: TriggerRun
}

const RECENT_RUNS_PER_PAGE = 10
const TASKS_PER_PAGE = 5

// Run history item component
const RunHistoryItem: FC<{
  run: TriggerRun
  onNavigate?: (messageId: string) => void
}> = ({ run, onNavigate }) => {
  const ranAt = dayjs(run.ran_at)
  const relativeTimeStr = ranAt.fromNow()
  const fullTime = ranAt.format('MMM D, YYYY [at] h:mm A')

  return (
    <button
      onClick={() => onNavigate?.(run.message_id)}
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors group/run"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover/run:bg-primary transition-colors" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground group-hover/run:text-foreground transition-colors">
          {relativeTimeStr}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover/run:opacity-100 transition-opacity">
        {fullTime}
      </span>
      <ChevronRightIcon className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover/run:opacity-100 transition-opacity" />
    </button>
  )
}

// Task item component
const TaskItem: FC<{
  trigger: Trigger
  onEdit?: (trigger: Trigger) => void
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
  showSessionInfo?: boolean
  mode: TasksViewMode
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
  showSessionInfo = false,
  mode,
}) => {
  const router = useRouter()
  const [isExecuting, setIsExecuting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRuns, setShowRuns] = useState(false)

  const sessionInfo = useMemo(() => getSessionInfo(trigger), [trigger])

  const scheduleDisplay = useMemo(() => {
    if (!trigger.schedule) return null

    if (trigger.status === 'paused') {
      return 'Paused'
    }

    if (trigger.status === 'running') {
      return 'Running...'
    }

    const scheduleWithTimezone = {
      ...trigger.schedule,
      timezone: timezone,
    }
    const description = formatCronSchedule(scheduleWithTimezone)

    // For archived/finished tasks, just show the recurrence pattern without "Next: X"
    if (isFinished || trigger.status === 'finished') {
      return description
    }

    if (trigger.next_scheduled_run) {
      const zonedTime = dayjs(trigger.next_scheduled_run).tz(timezone)
      const now = dayjs().tz(timezone)
      const tomorrow = now.add(1, 'day')

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
  }, [
    trigger.schedule,
    trigger.next_scheduled_run,
    trigger.status,
    timezone,
    isFinished,
  ])

  const runs = useMemo(() => {
    return (trigger.runs || []).slice().reverse()
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
            : showSessionInfo
            ? {
                label: 'View Session',
                onClick: () => router.push(`/sessions/${sessionInfo.id}`),
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
      // If task has no schedule (one-time task), set status to active with no schedule
      // If task has a schedule, just set status to active and keep the schedule
      const payload = trigger.schedule
        ? { status: 'active' }
        : { status: 'active', schedule: null }

      await axios.patch(`/api/triggers/${trigger._id}`, payload)
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

  const handleNavigateToRun = (messageId: string) => {
    if (onNavigateToMessage) {
      onNavigateToMessage(messageId)
    } else {
      router.push(`/sessions/${sessionInfo.id}?message=${messageId}`)
    }
  }

  // For global/agent mode, link to session settings for editing
  const getEditLink = () => {
    return `/sessions/${sessionInfo.id}?settings=tasks`
  }

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Play Button / Running Indicator */}
        {!isFinished && (
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
              trigger.status === 'running' || isExecuting
                ? 'bg-primary/10 cursor-default'
                : 'bg-primary/10 hover:bg-primary/20 active:scale-95 cursor-pointer',
            )}
            title={
              trigger.status === 'running' || isExecuting
                ? 'Running...'
                : 'Run now'
            }
          >
            {trigger.status === 'running' || isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <button
                onClick={handleExecuteNow}
                disabled={isExecuting || trigger.status === 'running'}
                className="w-full h-full flex items-center justify-center"
              >
                <PlayIcon className="h-4 w-4 text-primary fill-primary" />
              </button>
            )}
          </div>
        )}

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {trigger.name || trigger.prompt}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {/* Session info (for global/agent modes) */}
            {showSessionInfo && (
              <>
                <Link
                  href={`/sessions/${sessionInfo.id}`}
                  className="flex items-center gap-1.5 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {sessionInfo.agents.length > 0 && (
                    <AgentAvatars
                      agents={sessionInfo.agents}
                      className="scale-75 origin-left -ml-1"
                    />
                  )}
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {sessionInfo.title}
                  </span>
                </Link>
                {scheduleDisplay && (
                  <span className="text-muted-foreground/30">·</span>
                )}
              </>
            )}
            {scheduleDisplay && (
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">
                  {scheduleDisplay}
                </span>
              </div>
            )}
          </div>
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

        {/* Context Menu */}
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
                {mode === 'session' && onEdit ? (
                  <DropdownMenuItem onClick={() => onEdit(trigger)}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href={getEditLink()}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
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
                  onNavigate={handleNavigateToRun}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Generic pagination component
const Pagination: FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-muted/20 rounded-md">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        {currentPage + 1} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Recent runs pagination component
const RecentRunsPagination: FC<{
  currentPage: number
  totalPages: number
  totalRuns: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, totalRuns, onPageChange }) => {
  const startItem = currentPage * RECENT_RUNS_PER_PAGE + 1
  const endItem = Math.min((currentPage + 1) * RECENT_RUNS_PER_PAGE, totalRuns)

  return (
    <div className="flex items-center justify-between mt-3 px-3 py-2 bg-muted/30 rounded-md">
      <span className="text-xs text-muted-foreground">
        {startItem}-{endItem} of {totalRuns} runs
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          {currentPage + 1} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export const TasksView: FC<TasksViewProps> = ({
  mode,
  sessionId,
  agentId,
  isModalOpen = true,
  onTasksChange,
  onNavigateToMessage,
  showHeader = false,
  headerTitle,
  headerDescription,
}) => {
  const router = useRouter()
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
  const [recentRunsPage, setRecentRunsPage] = useState(0)
  const [activeTasksPage, setActiveTasksPage] = useState(0)
  const [scheduledTasksPage, setScheduledTasksPage] = useState(0)
  const [archivedTasksPage, setArchivedTasksPage] = useState(0)

  const tasksGate = useGatedResource(GatedResource.Tasks, {
    lockedBehavior: 'modal',
  })

  const triggersQuery = useUserTriggersQuery({
    enabled: tasksGate.isAllowed && isModalOpen,
  })

  // Reset page numbers when switching tabs or when filters change
  React.useEffect(() => {
    setActiveTasksPage(0)
    setScheduledTasksPage(0)
    setArchivedTasksPage(0)
    setRecentRunsPage(0)
  }, [activeTab, mode, sessionId, agentId])

  // Filter triggers based on mode
  const filteredTriggers = useMemo(() => {
    const allTriggers = (triggersQuery.triggers || []) as Trigger[]

    if (mode === 'global') {
      return allTriggers
    }

    if (mode === 'session' && sessionId) {
      return allTriggers.filter(trigger => {
        const triggerSessionId =
          typeof trigger.session === 'object' && trigger.session !== null
            ? (trigger.session as TriggerSession)._id
            : trigger.session
        return triggerSessionId === sessionId
      })
    }

    if (mode === 'agent' && agentId) {
      return allTriggers.filter(trigger => {
        if (typeof trigger.session === 'object' && trigger.session !== null) {
          const session = trigger.session as TriggerSession
          return session.agents?.some(agent => agent._id === agentId)
        }
        return false
      })
    }

    return allTriggers
  }, [triggersQuery.triggers, mode, sessionId, agentId])

  const { manualTriggers, scheduledTriggers, archivedTriggers, allRecentRuns } =
    useMemo(() => {
      const archived = filteredTriggers.filter(trigger => {
        if (trigger.status === 'finished') {
          return true
        }
        if (!trigger.schedule) {
          return false
        }
        if (trigger.schedule.end_date) {
          const endDate = new Date(trigger.schedule.end_date)
          const currentDate = new Date()
          return endDate <= currentDate
        }
        return false
      })

      const active = filteredTriggers.filter(trigger => {
        if (trigger.status === 'finished') {
          return false
        }
        if (!trigger.schedule) {
          return true
        }
        if (
          trigger.status === 'active' ||
          trigger.status === 'paused' ||
          trigger.status === 'running'
        ) {
          if (trigger.schedule.end_date) {
            const endDate = new Date(trigger.schedule.end_date)
            const currentDate = new Date()
            return endDate > currentDate
          }
          return true
        }
        return false
      })

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

      // Collect all runs from filtered triggers
      const allRuns: RecentRunItem[] = []
      filteredTriggers.forEach(trigger => {
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
        allRecentRuns: allRuns,
      }
    }, [filteredTriggers])

  // Combine pending runs with actual runs
  const combinedRecentRuns = useMemo(() => {
    const actualRunIds = new Set(allRecentRuns.map(r => r.run.message_id))
    const uniquePendingRuns = pendingRuns.filter(
      pr => !actualRunIds.has(pr.run.message_id),
    )
    return [...uniquePendingRuns, ...allRecentRuns]
  }, [allRecentRuns, pendingRuns])

  // Paginated recent runs
  const paginatedRecentRuns = useMemo(() => {
    const start = recentRunsPage * RECENT_RUNS_PER_PAGE
    const end = start + RECENT_RUNS_PER_PAGE
    return combinedRecentRuns.slice(start, end)
  }, [combinedRecentRuns, recentRunsPage])

  const totalRecentRunsPages = Math.ceil(
    combinedRecentRuns.length / RECENT_RUNS_PER_PAGE,
  )

  // Paginated manual/active tasks
  const paginatedManualTasks = useMemo(() => {
    const start = activeTasksPage * TASKS_PER_PAGE
    const end = start + TASKS_PER_PAGE
    return manualTriggers.slice(start, end)
  }, [manualTriggers, activeTasksPage])

  const totalActiveTasksPages = Math.ceil(
    manualTriggers.length / TASKS_PER_PAGE,
  )

  // Paginated scheduled tasks
  const paginatedScheduledTasks = useMemo(() => {
    const start = scheduledTasksPage * TASKS_PER_PAGE
    const end = start + TASKS_PER_PAGE
    return scheduledTriggers.slice(start, end)
  }, [scheduledTriggers, scheduledTasksPage])

  const totalScheduledTasksPages = Math.ceil(
    scheduledTriggers.length / TASKS_PER_PAGE,
  )

  // Paginated archived tasks
  const paginatedArchivedTasks = useMemo(() => {
    const start = archivedTasksPage * TASKS_PER_PAGE
    const end = start + TASKS_PER_PAGE
    return archivedTriggers.slice(start, end)
  }, [archivedTriggers, archivedTasksPage])

  const totalArchivedTasksPages = Math.ceil(
    archivedTriggers.length / TASKS_PER_PAGE,
  )

  // Reset to first page when filters change
  const handleRecentRunsPageChange = useCallback((page: number) => {
    setRecentRunsPage(page)
  }, [])

  const handleActiveTasksPageChange = useCallback((page: number) => {
    setActiveTasksPage(page)
  }, [])

  const handleScheduledTasksPageChange = useCallback((page: number) => {
    setScheduledTasksPage(page)
  }, [])

  const handleArchivedTasksPageChange = useCallback((page: number) => {
    setArchivedTasksPage(page)
  }, [])

  const handleRunComplete = useCallback(
    (triggerId: string) => {
      const allActive = [...manualTriggers, ...scheduledTriggers]
      const trigger = allActive.find(t => t._id === triggerId)
      if (trigger) {
        const pendingRun: RecentRunItem = {
          trigger,
          run: {
            message_id: `pending-${Date.now()}`,
            ran_at: new Date(),
          },
        }
        setPendingRuns(prev => [pendingRun, ...prev])
      }
      triggersQuery.invalidate()
      onTasksChange?.()

      setTimeout(() => {
        setPendingRuns([])
      }, 3000)
    },
    [manualTriggers, scheduledTriggers, triggersQuery, onTasksChange],
  )

  const handleNavigateToLatest = useCallback(() => {
    if (
      combinedRecentRuns.length > 0 &&
      !combinedRecentRuns[0].run.message_id.startsWith('pending-')
    ) {
      if (onNavigateToMessage) {
        onNavigateToMessage(combinedRecentRuns[0].run.message_id)
      }
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

  const handleTaskChange = useCallback(() => {
    triggersQuery.invalidate()
    onTasksChange?.()
  }, [triggersQuery, onTasksChange])

  const handleNavigateToRun = (trigger: Trigger, messageId: string) => {
    if (onNavigateToMessage) {
      onNavigateToMessage(messageId)
    } else {
      const sessionInfo = getSessionInfo(trigger)
      router.push(`/sessions/${sessionInfo.id}?message=${messageId}`)
    }
  }

  // Show session info for global and agent modes
  const showSessionInfo = mode !== 'session'
  // Show create button for session mode (with sessionId) or for agent/global modes
  const showCreateButton = mode === 'session' ? !!sessionId : true

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
    if (mode === 'session') {
      return (
        <TaskForm
          sessionId={sessionId}
          editingTask={editingTask}
          onCancel={handleFormCancel}
          onSave={handleFormSave}
        />
      )
    } else {
      return (
        <TaskFormWithSelectors
          mode={mode as 'agent' | 'global'}
          agentId={agentId}
          editingTask={editingTask}
          onCancel={handleFormCancel}
          onSave={handleFormSave}
        />
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Optional Header */}
      {showHeader && (
        <div className="hidden md:block">
          <h2 className="text-2xl font-semibold">{headerTitle || 'Tasks'}</h2>
          {headerDescription && (
            <p className="text-muted-foreground">{headerDescription}</p>
          )}
        </div>
      )}

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
        {showCreateButton && (
          <Button onClick={handleCreateNew} size="sm" className="gap-2">
            <PlusIcon className="w-4 h-4" />
            Create Task
          </Button>
        )}
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
          {/* Empty state */}
          {manualTriggers.length === 0 && scheduledTriggers.length === 0 ? (
            <div className="bg-background rounded-lg border">
              <div className="text-center p-8 text-muted-foreground">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No active tasks</p>
                <p className="text-sm">
                  {mode === 'session'
                    ? 'Schedule tasks for this session.'
                    : mode === 'agent'
                    ? 'No tasks found for sessions with this agent.'
                    : 'Create tasks from within a session to automate your agents.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Manual Tasks (no schedule) */}
              {manualTriggers.length > 0 && (
                <div>
                  <div className="bg-background rounded-lg border divide-y">
                    {paginatedManualTasks.map(trigger => (
                      <TaskItem
                        key={trigger._id}
                        trigger={trigger}
                        onEdit={mode === 'session' ? handleEdit : undefined}
                        onArchive={handleTaskChange}
                        onReactivate={handleTaskChange}
                        onPause={handleTaskChange}
                        onResume={handleTaskChange}
                        onDelete={handleTaskChange}
                        onRunComplete={handleRunComplete}
                        onNavigateToMessage={onNavigateToMessage}
                        onNavigateToLatest={handleNavigateToLatest}
                        isFinished={false}
                        timezone={userTimezone}
                        showSessionInfo={showSessionInfo}
                        mode={mode}
                      />
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalActiveTasksPages > 1 && (
                    <Pagination
                      currentPage={activeTasksPage}
                      totalPages={totalActiveTasksPages}
                      onPageChange={handleActiveTasksPageChange}
                    />
                  )}
                </div>
              )}

              {/* Scheduled Tasks */}
              {scheduledTriggers.length > 0 && (
                <div>
                  <div className="mb-2 px-1">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                      Scheduled
                    </span>
                  </div>
                  <div className="bg-background rounded-lg border divide-y">
                    {paginatedScheduledTasks.map(trigger => (
                      <TaskItem
                        key={trigger._id}
                        trigger={trigger}
                        onEdit={mode === 'session' ? handleEdit : undefined}
                        onArchive={handleTaskChange}
                        onReactivate={handleTaskChange}
                        onPause={handleTaskChange}
                        onResume={handleTaskChange}
                        onDelete={handleTaskChange}
                        onRunComplete={handleRunComplete}
                        onNavigateToMessage={onNavigateToMessage}
                        onNavigateToLatest={handleNavigateToLatest}
                        isFinished={false}
                        timezone={userTimezone}
                        showSessionInfo={showSessionInfo}
                        mode={mode}
                      />
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalScheduledTasksPages > 1 && (
                    <Pagination
                      currentPage={scheduledTasksPage}
                      totalPages={totalScheduledTasksPages}
                      onPageChange={handleScheduledTasksPageChange}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Section with Pagination */}
          {combinedRecentRuns.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 px-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                  Recent
                </span>
              </div>
              <div className="space-y-0.5">
                {paginatedRecentRuns.map((item, index) => {
                  const ranAt = dayjs(item.run.ran_at)
                  const isPending = item.run.message_id.startsWith('pending-')
                  const sessionInfo = getSessionInfo(item.trigger)
                  return (
                    <button
                      key={`${item.run.message_id}-${index}`}
                      onClick={() =>
                        !isPending &&
                        handleNavigateToRun(item.trigger, item.run.message_id)
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
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {showSessionInfo && sessionInfo.agents.length > 0 && (
                          <AgentAvatars
                            agents={sessionInfo.agents}
                            className="scale-[0.6] origin-left -ml-1 -mr-2"
                          />
                        )}
                        <span className="text-[13px] truncate text-foreground/80">
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
              {/* Pagination */}
              {totalRecentRunsPages > 1 && (
                <RecentRunsPagination
                  currentPage={recentRunsPage}
                  totalPages={totalRecentRunsPages}
                  totalRuns={combinedRecentRuns.length}
                  onPageChange={handleRecentRunsPageChange}
                />
              )}
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
        <div>
          <div className="bg-background rounded-lg border divide-y">
            {paginatedArchivedTasks.map(trigger => (
              <TaskItem
                key={trigger._id}
                trigger={trigger}
                onEdit={mode === 'session' ? handleEdit : undefined}
                onArchive={handleTaskChange}
                onReactivate={handleTaskChange}
                onPause={handleTaskChange}
                onResume={handleTaskChange}
                onDelete={handleTaskChange}
                onRunComplete={handleRunComplete}
                onNavigateToMessage={onNavigateToMessage}
                onNavigateToLatest={handleNavigateToLatest}
                isFinished={true}
                timezone={userTimezone}
                showSessionInfo={showSessionInfo}
                mode={mode}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalArchivedTasksPages > 1 && (
            <Pagination
              currentPage={archivedTasksPage}
              totalPages={totalArchivedTasksPages}
              onPageChange={handleArchivedTasksPageChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default TasksView
