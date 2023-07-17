import { useCreationState } from '@/hooks/useCreationState'
import { Task } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  taskIds: string[]
  setTaskIds?: (taskIds: string[]) => void
  pendingTasks?: Task[]
  completedTasks?: Task[]
  failedTasks?: Task[]
  setCompletedTasks?: (completedTasks: Task[]) => void
  setFailedTasks?: (failedTasks: Task[]) => void
  activeTaskId?: string
  setActiveTaskId?: (taskId: string) => void
  hasChangedGenerator?: boolean
  setHasChangedGenerator?: (hasChangedGenerator: boolean) => void
  refetchPendingTasks?: () => void
}

export const CreationNotificationContext =
  createContext<CreationNotificationContextType>({
    taskIds: [],
    setTaskIds: undefined,
    pendingTasks: undefined,
    completedTasks: undefined,
    setCompletedTasks: undefined,
    failedTasks: undefined,
    setFailedTasks: undefined,
    activeTaskId: undefined,
    setActiveTaskId: undefined,
    hasChangedGenerator: undefined,
    setHasChangedGenerator: undefined,
    refetchPendingTasks: undefined,
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
