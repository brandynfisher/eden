'use client'

import type { SessionError } from '@/features/sessions/components/error-display'
import { useCallback, useState } from 'react'

export function useSessionErrors() {
  const [errors, setErrors] = useState<SessionError[]>([])

  const addError = useCallback((error: Omit<SessionError, 'id'>) => {
    const newError: SessionError = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setErrors(prev => [...prev, newError])
    return newError.id
  }, [])

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const hasErrors = errors.length > 0

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
  }
}
