import { useCreationState } from '@/hooks/useCreationState'
import { Task } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  tasks?: Task[]
  pendingTasks?: Task[]
  setPendingTasks?: (pendingTasks: Task[]) => void
  completedTasks?: Task[]
  setCompletedTasks?: (completedTasks: Task[]) => void
  failedTasks?: Task[]
  setFailedTasks?: (failedTasks: Task[]) => void
  dismissedTaskIds?: string[]
  addDismissedTaskIds: (dismissedTaskIds: string[]) => void
  activeTaskId?: string
  setActiveTaskId?: (taskId: string) => void
  hasChangedGenerator?: boolean
  setHasChangedGenerator?: (hasChangedGenerator: boolean) => void
}

export const CreationNotificationContext =
  createContext<CreationNotificationContextType>({
    tasks: undefined,
    pendingTasks: undefined,
    setPendingTasks: undefined,
    failedTasks: undefined,
    setFailedTasks: undefined,
    completedTasks: undefined,
    setCompletedTasks: undefined,
    dismissedTaskIds: undefined,
    addDismissedTaskIds: () => undefined,
    activeTaskId: undefined,
    setActiveTaskId: undefined,
    hasChangedGenerator: undefined,
    setHasChangedGenerator: undefined,
  })

function CreationNotificationProvider({ children }: PropsWithChildren) {
  const CreationNotificationState = useCreationState()

  return (
    <CreationNotificationContext.Provider value={CreationNotificationState}>
      {children}
    </CreationNotificationContext.Provider>
  )
}

export default CreationNotificationProvider
