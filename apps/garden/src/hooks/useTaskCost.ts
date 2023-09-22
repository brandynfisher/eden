import { requireAuth } from '@/lib/auth'
import { UserContext } from '@/providers/UserProvider'
import { Task } from '@edenlabs/eden-sdk'
import { App } from 'antd'
import axios from 'axios'
import { useCallback, useContext, useEffect, useState } from 'react'

export const useTaskCost = () => {
  const { message } = App.useApp()
  const [taskCost, setTaskCost] = useState<number | undefined>()
  const [isLoadingTaskCost, setIsLoadingTaskCost] = useState<boolean | null>(
    null,
  )
  const [canAffordOperation, setCanAffordOperation] = useState(false)

  const { mannaBalance, isAuthenticated, authenticate } =
    useContext(UserContext)

  useEffect(() => {
    if (taskCost && mannaBalance) {
      setCanAffordOperation(mannaBalance >= taskCost)
    } else {
      setCanAffordOperation(true)
    }
  }, [taskCost, mannaBalance])

  const getTaskCost = useCallback(
    async (generatorName: string, config: Task['config']) => {
      setIsLoadingTaskCost(true)

      if (!isAuthenticated) {
        await requireAuth(authenticate)

        setIsLoadingTaskCost(false)
        return
      }

      try {
        message.destroy()

        const response = await axios.post('/api/tasks/cost', {
          generatorName,
          config,
        })

        setTaskCost(response.data?.cost || undefined)
      } catch (err) {
        console.error(err)
        message.error('Error fetching task cost estimate')
      } finally {
        setIsLoadingTaskCost(false)
      }
    },
    [],
  )

  return {
    getTaskCost,
    taskCost,
    isLoadingTaskCost,
    canAffordOperation,
  }
}
