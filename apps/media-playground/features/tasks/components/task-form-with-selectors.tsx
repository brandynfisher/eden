'use client'

import { AgentSelector } from './agent-selector'
import { SessionSelector } from './session-selector'
import { TaskForm } from '@/features/sessions/components/session-settings-tabs/task-form'
import { Agent, SessionV2, Trigger } from '@edenlabs/eden-sdk'
import { FC, useEffect, useState } from 'react'

type TaskFormWithSelectorsProps = {
  mode: 'agent' | 'global'
  agentId?: string // Required for agent mode
  editingTask?: Trigger | null
  onCancel: () => void
  onSave: () => void
}

export const TaskFormWithSelectors: FC<TaskFormWithSelectorsProps> = ({
  mode,
  agentId,
  editingTask,
  onCancel,
  onSave,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionV2 | null>(null)

  // Reset session when agent changes (global mode)
  useEffect(() => {
    if (mode === 'global') {
      setSelectedSession(null)
    }
  }, [selectedAgent, mode])

  // Reset all selections when form opens/closes (when editingTask changes)
  useEffect(() => {
    if (!editingTask) {
      setSelectedAgent(null)
      setSelectedSession(null)
    }
  }, [editingTask])

  // Handler for going back
  const handleBack = () => {
    if (selectedSession) {
      // If on task form step, go back to session selector
      setSelectedSession(null)
    } else if (selectedAgent && mode === 'global') {
      // If on session selector in global mode, go back to agent selector
      setSelectedAgent(null)
    } else {
      // Otherwise, cancel
      onCancel()
    }
  }

  // Agent mode flow: Session selector → Task form
  if (mode === 'agent') {
    if (!selectedSession) {
      return (
        <SessionSelector
          agentId={agentId!}
          onSelect={setSelectedSession}
          onCancel={onCancel}
        />
      )
    }

    return (
      <TaskForm
        sessionId={selectedSession._id}
        editingTask={editingTask}
        onCancel={handleBack}
        onSave={onSave}
      />
    )
  }

  // Global mode flow: Agent selector → Session selector → Task form
  if (mode === 'global') {
    if (!selectedAgent) {
      return <AgentSelector onSelect={setSelectedAgent} onCancel={onCancel} />
    }

    if (!selectedSession) {
      return (
        <SessionSelector
          agentId={selectedAgent._id}
          onSelect={setSelectedSession}
          onCancel={handleBack}
        />
      )
    }

    return (
      <TaskForm
        sessionId={selectedSession._id}
        editingTask={editingTask}
        onCancel={handleBack}
        onSave={onSave}
      />
    )
  }

  return null
}
