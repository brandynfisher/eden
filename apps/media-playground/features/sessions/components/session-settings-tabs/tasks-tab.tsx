'use client'

import { TasksView } from '@/features/tasks/components/tasks-view'

type TasksTabProps = {
  isModalOpen: boolean
  sessionId?: string
  onTasksChange?: () => void
  onNavigateToMessage?: (messageId: string) => void
}

export const TasksTab = ({
  isModalOpen,
  sessionId,
  onTasksChange,
  onNavigateToMessage,
}: TasksTabProps) => {
  return (
    <TasksView
      mode="session"
      sessionId={sessionId}
      isModalOpen={isModalOpen}
      onTasksChange={onTasksChange}
      onNavigateToMessage={onNavigateToMessage}
    />
  )
}
