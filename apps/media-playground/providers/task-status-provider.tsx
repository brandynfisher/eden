'use client'

import {
  IPage,
  PageData,
  RowItem,
  addDocIfNotExistInPage,
  updateDocInPage,
} from '@/lib/mutations/query'
import { useWebSocketContext } from '@/providers/websocket-provider'
import { TaskV2, TaskV2Status } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type TaskStatusContextType = {
  allTasks: TaskV2[]
  pendingRunningTasks: TaskV2[]
  failedTasks: TaskV2[]
  completedTasks: TaskV2[]
  cancelledTasks: TaskV2[]
}

const TaskStatusContext = createContext<TaskStatusContextType>({
  allTasks: [],
  pendingRunningTasks: [],
  failedTasks: [],
  completedTasks: [],
  cancelledTasks: [],
})

export const useTaskStatus = () => useContext(TaskStatusContext)

type Props = {
  children: React.ReactNode
}

export const TaskStatusProvider = ({ children }: Props) => {
  const { lastMessageJson } = useWebSocketContext()
  const [allTasks, setAllTasks] = useState<TaskV2[]>([])
  const queryClient = useQueryClient()

  // Fetch initial tasks on mount
  useEffect(() => {
    const fetchInitialTasks = async () => {
      try {
        const response = await fetch('/api/tasks/list')
        const data: TaskV2[] = await response.json()
        setAllTasks(data)
      } catch (error) {
        console.error('Error fetching initial tasks:', error)
      }
    }

    fetchInitialTasks()
  }, [])

  // Handle WebSocket messages to update tasks
  useEffect(() => {
    if (!lastMessageJson) return

    const { event, data } = lastMessageJson

    if (event === 'task-update' && data?.task) {
      const taskUpdate = data.task as TaskV2

      // Update global query cache if needed
      try {
        queryClient.setQueryData(
          ['tasks', taskUpdate.workflow],
          (old: PageData<IPage<RowItem>> | undefined) => {
            if (!old || !old.pages.length) {
              console.error('No pages to update!')
              return old
            }

            let updatedPages: IPage<RowItem>[] = [...old.pages]
            const pageIndex = updatedPages.findIndex(page =>
              page?.docs?.some(doc => doc._id === taskUpdate._id),
            )

            if (pageIndex === -1) {
              updatedPages = addDocIfNotExistInPage(taskUpdate, updatedPages)
            } else {
              updatedPages = updateDocInPage(taskUpdate, updatedPages)
            }

            return { ...old, pages: updatedPages }
          },
        )
      } catch (e) {
        console.error('Error updating query cache:', e)
      }

      // Update allTasks ensuring uniqueness
      setAllTasks(prev => {
        const existingTaskIndex = prev.findIndex(t => t._id === taskUpdate._id)
        if (existingTaskIndex === -1) {
          return [...prev, taskUpdate]
        } else {
          const updatedTasks = [...prev]
          updatedTasks[existingTaskIndex] = taskUpdate
          return updatedTasks
        }
      })
    }
  }, [lastMessageJson, queryClient])

  // Categorize tasks based on their status
  const pendingRunningTasks = useMemo(() => {
    return allTasks.filter(
      task =>
        task.status === TaskV2Status.Pending ||
        task.status === TaskV2Status.Running,
    )
  }, [allTasks])

  const failedTasks = useMemo(() => {
    return allTasks.filter(task => task.status === TaskV2Status.Failed)
  }, [allTasks])

  const completedTasks = useMemo(() => {
    return allTasks
      .filter(task => task.status === TaskV2Status.Completed)
      .slice(0, 10) // Keep only the last 10 completed tasks
  }, [allTasks])

  const cancelledTasks = useMemo(() => {
    return allTasks.filter(task => task.status === TaskV2Status.Cancelled)
  }, [allTasks])

  // Memoize context value to optimize performance
  const contextValue = useMemo(
    () => ({
      allTasks,
      pendingRunningTasks,
      failedTasks,
      completedTasks,
      cancelledTasks,
    }),
    [
      allTasks,
      pendingRunningTasks,
      failedTasks,
      completedTasks,
      cancelledTasks,
    ],
  )

  return (
    <TaskStatusContext.Provider value={contextValue}>
      {children}
    </TaskStatusContext.Provider>
  )
}
