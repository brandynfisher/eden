import { useState } from 'react'

const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void, boolean] => {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const readValue = (): T => {
    setIsLoading(true)
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      const value = item ? JSON.parse(item) : initialValue
      setIsLoading(false)
      return value
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      setIsLoading(false)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = (value: T) => {
    if (typeof window == 'undefined') {
      console.warn(
        `Tried setting localStorage key "${key}" even though environment is not a client`,
      )
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value

      window.localStorage.setItem(key, JSON.stringify(newValue))

      setStoredValue(newValue)
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoading]
}

export default useLocalStorage
