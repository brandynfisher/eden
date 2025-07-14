'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import TaskFormModal from '@/features/chat/components/task-form-modal'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { Trigger } from '@edenlabs/eden-sdk'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  AlertCircle,
  ChevronDownIcon,
  ClockIcon,
  EditIcon,
  Eye,
  Loader2,
  PlusIcon,
  TrashIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useMemo, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

const TaskItem: FC<{
  trigger: Trigger
  agentId: string
  onEdit: (trigger: Trigger) => void
  onDelete: (triggerId: string) => void
}> = ({ trigger, agentId, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const formattedSchedule = formatCronSchedule(trigger.schedule)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/agents/${agentId}/triggers/${trigger._id}`)
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
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {trigger.instruction}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formattedSchedule}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last run: {formatLastRunTime(trigger.last_run_time)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trigger.session && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sessions/${trigger.session}`)}
            className="h-8 w-8 p-0"
            title="View session where results are routed"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(trigger)}
          className="h-8 w-8 p-0"
        >
          <EditIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TrashIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
const AgentTasksView: FC<{
  agent: Agent
}> = ({ agent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)
  const [showFinished, setShowFinished] = useState(false)

  const triggersQuery = useAgentTriggersQuery({
    key: agent._id,
    enabled: true,
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

    // Sort both arrays by updatedAt in descending order (most recent first)
    const sortByUpdatedAt = (a: Trigger, b: Trigger) => {
      // Sort by last_run_time first (most recent first), then by updatedAt/createdAt
      const aLastRun = a.last_run_time ? new Date(a.last_run_time).getTime() : 0
      const bLastRun = b.last_run_time ? new Date(b.last_run_time).getTime() : 0

      if (aLastRun !== bLastRun) {
        return bLastRun - aLastRun // Most recent last_run_time first
      }

      // If last_run_time is the same (or both null), fall back to updatedAt/createdAt
      const aDate = new Date(a.updatedAt || a.createdAt)
      const bDate = new Date(b.updatedAt || b.createdAt)
      return bDate.getTime() - aDate.getTime()
    }

    return {
      activeTriggers: active.sort(sortByUpdatedAt),
      finishedTriggers: finished.sort(sortByUpdatedAt),
    }
  }, [triggersQuery.triggers])

  const handleCreateNew = () => {
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

  return (
    <div className="flex-1 overflow-auto bg-accent">
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground">
              Schedule automated tasks for {agent.name}
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            Create Task
          </Button>
        </div>

        {/* Task Modal */}
        <TaskFormModal
          agent={agent}
          editingTask={editingTask}
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onSave={handleSave}
        />

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
          ) : activeTriggers.length === 0 && finishedTriggers.length === 0 ? (
            <div className="bg-background rounded-lg border">
              <div className="text-center p-8 text-muted-foreground">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No scheduled tasks</p>
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
                        agentId={agent._id}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                            agentId={agent._id}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
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
      </div>
    </div>
  )
}

export default AgentTasksView
