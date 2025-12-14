'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { useAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { useAuthState } from '@/hooks/use-auth-state'
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
  ChevronRightIcon,
  ClockIcon,
  HistoryIcon,
  Loader2,
  MenuIcon,
  MoreVerticalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)
dayjs.extend(relativeTime)

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

const GlobalTaskItem: FC<{
  trigger: Trigger
  onArchive: (triggerId: string) => void
  onReactivate: (triggerId: string) => void
  onPause: (triggerId: string) => void
  onResume: (triggerId: string) => void
  onDelete: (triggerId: string) => void
  onRunComplete?: (triggerId: string) => void
  isFinished?: boolean
  timezone: string
}> = ({
  trigger,
  onArchive,
  onReactivate,
  onPause,
  onResume,
  onDelete,
  onRunComplete,
  isFinished = false,
  timezone,
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
          action: {
            label: 'View Session',
            onClick: () => router.push(`/sessions/${sessionInfo.id}`),
          },
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

  const handleNavigateToRun = (messageId: string) => {
    // Navigate to session with message anchor
    router.push(`/sessions/${sessionInfo.id}?message=${messageId}`)
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
          <div className="flex items-center gap-2 mt-0.5">
            {/* Session info with avatars */}
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
              <>
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">
                    {scheduleDisplay}
                  </span>
                </div>
              </>
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
                <DropdownMenuItem asChild>
                  <Link href={`/sessions/${sessionInfo.id}?settings=tasks`}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
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
              {runs.map((run, index) => {
                const ranAt = dayjs(run.ran_at)
                return (
                  <button
                    key={`${run.message_id}-${index}`}
                    onClick={() => handleNavigateToRun(run.message_id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors group/run"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover/run:bg-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground group-hover/run:text-foreground transition-colors">
                        {ranAt.fromNow()}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover/run:opacity-100 transition-opacity">
                      {ranAt.format('MMM D, YYYY [at] h:mm A')}
                    </span>
                    <ChevronRightIcon className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover/run:opacity-100 transition-opacity" />
                  </button>
                )
              })}
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

const TasksPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const { isLoading: isAuthLoading } = useAuthState()
  const router = useRouter()

  const userTimezone = useMemo(() => {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
    return 'UTC'
  }, [])

  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active')

  const tasksGate = useGatedResource(GatedResource.Tasks, {
    lockedBehavior: 'modal',
  })

  const triggersQuery = useUserTriggersQuery({
    enabled: tasksGate.isAllowed,
  })

  const { manualTriggers, scheduledTriggers, archivedTriggers, recentRuns } =
    useMemo(() => {
      const allTriggers = (triggersQuery.triggers || []) as Trigger[]

      const archived = allTriggers.filter(trigger => {
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

      const active = allTriggers.filter(trigger => {
        if (trigger.status === 'finished') {
          return false
        }

        if (!trigger.schedule) {
          return true
        }

        if (trigger.status === 'active' || trigger.status === 'paused') {
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

      // Collect all runs from all triggers and sort by most recent
      const allRuns: RecentRunItem[] = []
      allTriggers.forEach(trigger => {
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
        recentRuns: allRuns.slice(0, 15), // Show last 15 runs globally
      }
    }, [triggersQuery.triggers])

  const handleRunComplete = useCallback(() => {
    triggersQuery.invalidate()
  }, [triggersQuery])

  const handleTaskChange = useCallback(() => {
    triggersQuery.invalidate()
  }, [triggersQuery])

  const handleNavigateToRun = (trigger: Trigger, messageId: string) => {
    const sessionInfo = getSessionInfo(trigger)
    router.push(`/sessions/${sessionInfo.id}?message=${messageId}`)
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
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="w-full max-w-4xl mx-auto px-4 py-6 flex-1 min-h-0">
          {/* Header */}
          <div className="hidden md:block mb-6">
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground">
              Schedule automated tasks for your agents.
            </p>
          </div>

          {!tasksGate.isAllowed ? (
            <LockedFeatureBanner
              gate={tasksGate}
              title="Tasks are available on Basic and above"
              description="Automate your agents with scheduled tasks by upgrading your plan."
            />
          ) : (
            <div className="space-y-4">
              {/* Header with Tabs */}
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
                  {manualTriggers.length === 0 &&
                  scheduledTriggers.length === 0 ? (
                    <div className="bg-background rounded-lg border">
                      <div className="text-center p-8 text-muted-foreground">
                        <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          No active tasks
                        </p>
                        <p className="text-sm">
                          Create tasks from within a session to automate your
                          agents.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Manual Tasks (no schedule) */}
                      {manualTriggers.length > 0 && (
                        <div className="bg-background rounded-lg border divide-y">
                          {manualTriggers.map(trigger => (
                            <GlobalTaskItem
                              key={trigger._id}
                              trigger={trigger}
                              onArchive={handleTaskChange}
                              onReactivate={handleTaskChange}
                              onPause={handleTaskChange}
                              onResume={handleTaskChange}
                              onDelete={handleTaskChange}
                              onRunComplete={handleRunComplete}
                              isFinished={false}
                              timezone={userTimezone}
                            />
                          ))}
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
                            {scheduledTriggers.map(trigger => (
                              <GlobalTaskItem
                                key={trigger._id}
                                trigger={trigger}
                                onArchive={handleTaskChange}
                                onReactivate={handleTaskChange}
                                onPause={handleTaskChange}
                                onResume={handleTaskChange}
                                onDelete={handleTaskChange}
                                onRunComplete={handleRunComplete}
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
                  {recentRuns.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-2 px-1">
                        <span className="text-[11px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                          Recent
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {recentRuns.map((item, index) => {
                          const ranAt = dayjs(item.run.ran_at)
                          const sessionInfo = getSessionInfo(item.trigger)
                          return (
                            <button
                              key={`${item.run.message_id}-${index}`}
                              onClick={() =>
                                handleNavigateToRun(
                                  item.trigger,
                                  item.run.message_id,
                                )
                              }
                              className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-muted/50"
                            >
                              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                {sessionInfo.agents.length > 0 && (
                                  <AgentAvatars
                                    agents={sessionInfo.agents}
                                    className="scale-[0.6] origin-left -ml-1 -mr-2"
                                  />
                                )}
                                <span className="text-[13px] truncate text-foreground/80">
                                  {item.trigger.name || item.trigger.prompt}
                                </span>
                              </div>
                              <span className="text-[11px] tabular-nums text-muted-foreground/50">
                                {ranAt.fromNow()}
                              </span>
                              <ChevronRightIcon className="h-3 w-3 text-muted-foreground/30" />
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
                    <p className="text-lg font-medium mb-2">
                      No archived tasks
                    </p>
                    <p className="text-sm">
                      Completed or expired tasks will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-background rounded-lg border divide-y">
                  {archivedTriggers.map(trigger => (
                    <GlobalTaskItem
                      key={trigger._id}
                      trigger={trigger}
                      onArchive={handleTaskChange}
                      onReactivate={handleTaskChange}
                      onPause={handleTaskChange}
                      onResume={handleTaskChange}
                      onDelete={handleTaskChange}
                      onRunComplete={handleRunComplete}
                      isFinished={true}
                      timezone={userTimezone}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TasksPage
