// hooks/useToolPreset.ts
'use client'

import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useTaskQuery } from '@/hooks/query/use-task-query'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// hooks/useToolPreset.ts

// hooks/useToolPreset.ts

// hooks/useToolPreset.ts

type GenericValues = {
  [key: string]: number | string | undefined | boolean | null
}

export const useToolPreset = () => {
  const [presetValues, setPresetValues] = useState<GenericValues | false>(false)
  const queryParams = useSearchParams()
  const pathname = usePathname()

  // Extract query parameters
  const loraParam = queryParams.get('lora')
  const creationParam = queryParams.get('creation')
  const taskParam = queryParams.get('task')

  // console.log({ taskParam })

  // Use react-query to fetch creation data if creationParam is present
  const {
    creation: creationData,
    isLoading: isCreationLoading,
    error: creationError,
  } = useCreationQuery({
    key: creationParam || '',
    enabled: !!creationParam,
  })

  // Use react-query to fetch task data if taskParam is present
  const {
    task: taskData,
    isLoading: isTaskLoading,
    error: taskError,
  } = useTaskQuery({
    key: taskParam || '',
    enabled: !!taskParam,
  })

  // console.log({taskData, isTaskLoading, taskError})

  useEffect(() => {
    const derivePresetValues = () => {
      let newPreset: GenericValues = {}

      // Handle 'lora' parameter
      if (loraParam) {
        newPreset = {
          ...newPreset,
          use_lora: true,
          lora: loraParam,
        }
      }

      // Handle 'creation' parameter
      if (creationParam && creationData) {
        const args = creationData.args as GenericValues
        if (args && typeof args === 'object') {
          newPreset = {
            ...newPreset,
            ...args,
          }
        } else {
          console.warn('Creation data does not contain valid args')
        }
      }

      // Handle 'task' parameter
      if (taskParam && taskData) {
        const args = taskData.args as GenericValues
        if (args && typeof args === 'object') {
          newPreset = {
            ...newPreset,
            ...args,
          }
        } else {
          console.warn('Task data does not contain valid args')
        }
      }

      // Filter out fields with null values
      const filteredPreset = Object.entries(newPreset).reduce<GenericValues>(
        (acc, [key, value]) => {
          if (value !== null) {
            acc[key] = value
          }
          return acc
        },
        {},
      )

      // If any presets are set, update the state
      if (Object.keys(filteredPreset).length > 0) {
        setPresetValues(filteredPreset)
      } else {
        setPresetValues(false)
      }
    }

    derivePresetValues()
  }, [
    pathname,
    queryParams,
    loraParam,
    creationParam,
    creationData,
    taskParam,
    taskData,
  ])

  // Determine if any loading is in progress
  const isLoading = isCreationLoading || isTaskLoading

  // Capture the first error encountered
  const error = creationError || taskError

  // console.log({ presetValues })

  return {
    presetValues,
    isLoading,
    error,
  }
}
