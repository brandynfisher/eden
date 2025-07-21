'use client'

import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useTaskQuery } from '@/hooks/query/use-task-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type GenericValues = {
  [key: string]: number | string | undefined | boolean | null
}

export const useToolPreset = () => {
  const [presetValues, setPresetValues] = useState<GenericValues | undefined>(
    undefined,
  )
  const [appliedKey, setAppliedKey] = useState<string | null>(null)
  const router = useRouter()
  const queryParams = useSearchParams()

  // Extract query parameters
  const loraParam = queryParams?.get('lora')
  const creationParam = queryParams?.get('creation')
  const taskParam = queryParams?.get('task')

  const currentPresetKey = creationParam || taskParam || loraParam || null
  const {
    creation: creationData,
    isLoading: isCreationLoading,
    error: creationError,
  } = useCreationQuery({
    key: creationParam || '',
    enabled: !!creationParam && appliedKey !== currentPresetKey,
    staleTime: Infinity,
  })

  // Use react-query to fetch task data if taskParam is present
  const {
    task: taskData,
    isLoading: isTaskLoading,
    error: taskError,
  } = useTaskQuery({
    key: taskParam || '',
    enabled: !!taskParam && appliedKey !== currentPresetKey,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!currentPresetKey || appliedKey === currentPresetKey) return

    // Check if we're still loading any data
    if ((creationParam && isCreationLoading) || (taskParam && isTaskLoading)) {
      return
    }

    const derivePresetValues = () => {
      let newPreset: GenericValues = {}

      if (loraParam) {
        newPreset = {
          ...newPreset,
          use_lora: true,
          lora: loraParam,
        }
      }

      if (creationParam && creationData) {
        const args = creationData.task.args as GenericValues
        if (args && typeof args === 'object') {
          newPreset = {
            ...newPreset,
            ...args,
          }
        } else {
          console.warn('Creation data does not contain valid args')
        }
      }

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

          if (key === 'seed') {
            acc[key] = undefined
          }

          return acc
        },
        {},
      )

      // If any presets are set, update the state
      if (Object.keys(filteredPreset).length > 0) {
        setPresetValues(filteredPreset)
      }

      setAppliedKey(currentPresetKey)

      // Clean up URL params after applying presets
      if (loraParam || creationParam || taskParam) {
        // Get current URL and remove preset-related params
        const url = new URL(window.location.href)
        url.searchParams.delete('lora')
        url.searchParams.delete('creation')
        url.searchParams.delete('task')

        // Replace URL without triggering a re-render
        router.replace(url.pathname + url.search, { scroll: false })
      }
    }

    derivePresetValues()
  }, [
    currentPresetKey,
    appliedKey,
    creationData,
    taskData,
    isCreationLoading,
    isTaskLoading,
    creationParam,
    taskParam,
    loraParam,
    router,
  ])

  // Determine if any loading is in progress
  const isLoading =
    (isCreationLoading || isTaskLoading) && appliedKey !== currentPresetKey

  // Capture the first error encountered
  const error = creationError || taskError

  return {
    presetValues,
    isLoading,
    error,
  }
}
