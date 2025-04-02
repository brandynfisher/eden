import { useCallback, useEffect, useState } from 'react'

interface LocalStorageState<T> {
  data: T
  isLoading: boolean
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  // Initialize state with existing value from localStorage if available
  const [state, setState] = useState<LocalStorageState<T>>(() => {
    if (typeof window === 'undefined') {
      return { data: defaultValue, isLoading: true }
    }

    try {
      const item = localStorage.getItem(key)
      return {
        data: item ? (JSON.parse(item) as T) : defaultValue,
        isLoading: false,
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return { data: defaultValue, isLoading: false }
    }
  })

  // Update localStorage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't persist during SSR hydration
    if (state.isLoading) return

    try {
      localStorage.setItem(key, JSON.stringify(state.data))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, state.data, state.isLoading])

  const setValue = useCallback((newValue: T | ((val: T) => T)) => {
    setState(prev => {
      const nextValue =
        typeof newValue === 'function'
          ? (newValue as (val: T) => T)(prev.data)
          : newValue

      return {
        data: nextValue,
        isLoading: false,
      }
    })
  }, [])

  return [state, setValue] as const
}

export default useLocalStorage
