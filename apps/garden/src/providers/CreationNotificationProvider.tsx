import { useCreationState } from '@/hooks/useCreationState'
import React, { PropsWithChildren, createContext } from 'react'

export interface CreationNotificationContextType {
  taskIds: string[]
}

export const CreationNotificationContext =
  createContext<CreationNotificationContextType>({
    taskIds: [],
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
