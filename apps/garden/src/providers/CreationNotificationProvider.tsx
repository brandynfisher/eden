import { useCreationState } from '@/hooks/useCreationState'
import { Task } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  tasks: Task[]
  setTasks?: (tasks: Task[]) => void
  pendingTasks?: Task[]
  completedTasks?: Task[]
  failedTasks?: Task[]
  setCompletedTasks?: (completedTasks: Task[]) => void
  setFailedTasks?: (failedTasks: Task[]) => void
  activeTaskId?: string
  setActiveTaskId?: (taskId: string) => void
  hasChangedGenerator?: boolean
  setHasChangedGenerator?: (hasChangedGenerator: boolean) => void
  refetchTasks?: () => void
}

export const CreationNotificationContext =
  createContext<CreationNotificationContextType>({
    tasks: [],
    setTasks: undefined,
    pendingTasks: undefined,
    completedTasks: undefined,
    setCompletedTasks: undefined,
    failedTasks: undefined,
    setFailedTasks: undefined,
    activeTaskId: undefined,
    setActiveTaskId: undefined,
    hasChangedGenerator: undefined,
    setHasChangedGenerator: undefined,
    refetchTasks: undefined,
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
