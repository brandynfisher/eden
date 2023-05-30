import { usePendingCreationState } from '@/hooks/usePendingCreationState'
import React, { PropsWithChildren, createContext } from 'react'

export interface PendingCreationContextType {
  taskIds: string[]
}

export const PendingCreationContext = createContext<PendingCreationContextType>(
  {
    taskIds: [],
  },
)

function PendingCreationProvider({ children }: PropsWithChildren) {
  const PendingCreationState = usePendingCreationState()

  return (
    <PendingCreationContext.Provider value={PendingCreationState}>
      {children}
    </PendingCreationContext.Provider>
  )
}

export default PendingCreationProvider
