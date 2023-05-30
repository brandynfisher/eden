import { useState } from 'react'

export const usePendingCreationState = () => {
  const [taskIds] = useState<string[]>([])

  return {
    taskIds,
  }
}
