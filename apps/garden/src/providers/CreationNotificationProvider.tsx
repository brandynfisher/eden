import { useCreationState } from '@/hooks/useCreationState'
import { Task } from '@eden-labs/eden-sdk/dist/responses/TasksGetResponse'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  taskIds: string[]
  setTaskIds?: (taskIds: string[]) => void
  tasks?: Task[]
  pendingTasks?: Task[]
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
    tasks: undefined,
    pendingTasks: undefined,
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
