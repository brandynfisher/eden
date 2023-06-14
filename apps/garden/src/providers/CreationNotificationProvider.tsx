import { useCreationState } from '@/hooks/useCreationState'
import { Task } from '@eden-labs/eden-sdk'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  taskIds: string[]
  setTaskIds?: (taskIds: string[]) => void
  pendingTasks?: Task[]
  completedTasks?: Task[]
  setCompletedTasks?: (completedTasks: Task[]) => void
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
