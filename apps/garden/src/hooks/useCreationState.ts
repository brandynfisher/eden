import { useState } from 'react'

export const useCreationState = () => {
  const [taskIds] = useState<string[]>([])

  return {
    taskIds,
  }
}
