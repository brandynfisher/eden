'use client'

import DiscordIcon from '@/components/icons/discord'
import { TelegramIcon } from '@/components/icons/telegram'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import TaskFormModal from '@/features/chat/components/task-form-modal'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { cn } from '@/lib/utils'
import { Trigger } from '@edenlabs/eden-sdk'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  AlertCircle,
  ClockIcon,
  EditIcon,
  GlobeIcon,
  Loader2,
  PlusIcon,
  TrashIcon,
} from 'lucide-react'
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'discord':
        return <DiscordIcon size={16} />
      case 'telegram':
        return <TelegramIcon size={16} />
      case 'twitter':
        return <TwitterIcon size={16} />
      case 'web':
        return <GlobeIcon size={16} />
      default:
        return <GlobeIcon size={16} />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'discord':
        return 'text-primary'
      case 'telegram':
        return 'text-sky-500'
      case 'twitter':
        return 'text-blue-500'
      case 'web':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn('flex-shrink-0', getPlatformColor(trigger.platform))}
        >
          {getPlatformIcon(trigger.platform)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{trigger.message}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formattedSchedule}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
  user: unknown
}> = ({ agent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)

  const triggersQuery = useAgentTriggersQuery({
    key: agent._id,
    enabled: true,
  })

  const filteredTriggers = useMemo(() => {
    if (!triggersQuery.triggers) return []
    return triggersQuery.triggers.filter(trigger => {
      if (!trigger.schedule.end_date) return true
      const endDate = new Date(trigger.schedule.end_date)
      const currentDate = new Date()
      return endDate > currentDate
    })
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
    // Modal will close automatically on successful save
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
        <div className="bg-background rounded-lg border">
          {triggersQuery.isPending ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : triggersQuery.isError ? (
            <div className="flex items-center justify-center gap-2 p-8 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load tasks. Please try again later.</p>
            </div>
          ) : filteredTriggers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No scheduled tasks</p>
              <p className="text-sm">
                Create your first automated task to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTriggers.map(trigger => (
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
      </div>
    </div>
  )
}

export default AgentTasksView
