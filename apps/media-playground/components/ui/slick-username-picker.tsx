'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import axios, { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SlickUsernamePickerProps {
  value: string
  onChange: (value: string) => void
  displayName: string
  onBlur?: () => void
  disabled?: boolean
  originalValue?: string // NEW
  onStatusChange?: (
    status: 'available' | 'taken' | 'invalid' | 'checking' | null,
  ) => void // NEW
}

export const SlickUsernamePicker: FC<SlickUsernamePickerProps> = ({
  value,
  onChange,
  displayName,
  onBlur,
  disabled,
  originalValue,
  onStatusChange,
}) => {
  const [isChecking, setIsChecking] = useState(false)
  const [availability, setAvailability] = useState<
    'available' | 'taken' | 'invalid' | null
  >(null)
  const [lastCheckedValue, setLastCheckedValue] = useState('')

  // Call onStatusChange whenever status changes
  useEffect(() => {
    if (onStatusChange) {
      if (originalValue && value === originalValue) {
        onStatusChange('available')
      } else if (isChecking) {
        onStatusChange('checking')
      } else {
        onStatusChange(availability)
      }
    }
  }, [availability, isChecking, value, originalValue, onStatusChange])

  // Debounced availability check
  useEffect(() => {
    // Don't check if empty or too short
    if (!value || value.length < 2) {
      setAvailability(null)
      setIsChecking(false)
      return
    }

    // If value matches originalValue, always available
    if (originalValue && value === originalValue) {
      setAvailability('available')
      setIsChecking(false)
      return
    }

    // Don't check if already checked this value
    if (value === lastCheckedValue) {
      return
    }

    const timeoutId = setTimeout(async () => {
      // Double-check the value hasn't changed
      if (value === lastCheckedValue) return

      setIsChecking(true)
      setLastCheckedValue(value)

      try {
        if (value.length > 42) {
          setAvailability('invalid')
          return
        }

        const response = await axios.get(
          `/api/agents/check-username?username=${encodeURIComponent(value)}`,
        )
        console.log('Username check response:', response.data)
        setAvailability(response.data.available ? 'available' : 'taken')
      } catch (error) {
        const axiosError = error as AxiosError
        console.log('Username check error:', axiosError?.response?.status, axiosError?.response?.data)
        if (axiosError?.response?.status === 400) {
          setAvailability('invalid')
        } else if (axiosError?.response?.status === 409) {
          setAvailability('taken')
        } else {
          setAvailability(null)
        }
      } finally {
        setIsChecking(false)
      }
    }, 500) // Reduced debounce time for better UX

    return () => clearTimeout(timeoutId)
  }, [value, lastCheckedValue, originalValue])

  // Slugify function
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and dashes
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
  }

  // Auto-generate username from display name
  const generateUsername = async () => {
    if (!displayName.trim()) {
      toast.error('Enter a name first to generate a username')
      return
    }

    setIsChecking(true)

    let baseUsername = slugify(displayName)
    if (!baseUsername) {
      baseUsername = 'agent'
    }

    let candidate = baseUsername
    let counter = 1

    // Keep trying until we find an available username
    while (counter < 100) {
      // Safety limit
      try {
        const response = await axios.get(
          `/api/agents/check-username?username=${encodeURIComponent(
            candidate,
          )}`,
        )
        if (response.data.available) {
          onChange(candidate)
          setAvailability('available')
          setLastCheckedValue(candidate)
          setIsChecking(false)
          toast.success(`Generated username: ${candidate}`)
          return
        }
        candidate = `${baseUsername}-${counter}`
        counter += 1
      } catch (error) {
        break
      }
    }

    setIsChecking(false)
    toast.error('Could not generate an available username')
  }

  const getStatusIcon = () => {
    if (originalValue && value === originalValue) return null
    if (!value || value.length < 2) return null
    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    }

    switch (availability) {
      case 'available':
        return <div className="w-2 h-2 rounded-full bg-green-500" />
      case 'taken':
        return <div className="w-2 h-2 rounded-full bg-red-500" />
      case 'invalid':
        return <div className="w-2 h-2 rounded-full bg-orange-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    if (originalValue && value === originalValue) return null
    if (!value || value.length < 2) return null
    if (isChecking) return 'Checking availability...'
    switch (availability) {
      case 'available':
        return 'Username is available'
      case 'taken':
        return 'Username is already taken'
      case 'invalid':
        return 'Username must be 42 characters or less'
      default:
        return null
    }
  }

  const statusText = getStatusText()

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Username on Eden"
            value={value}
            onChange={e => {
              const newValue = e.target.value.slice(0, 42)
              onChange(newValue)
            }}
            onBlur={onBlur}
            disabled={disabled}
            className={cn(
              'pr-8',
              // Don't show status colors for original values
              originalValue && value === originalValue
                ? ''
                : availability === 'available' &&
                    'border-green-500 focus:border-green-500 focus:ring-green-500',
              originalValue && value === originalValue
                ? ''
                : availability === 'taken' &&
                    'border-red-500 focus:border-red-500 focus:ring-red-500',
              originalValue && value === originalValue
                ? ''
                : availability === 'invalid' &&
                    'border-orange-500 focus:border-orange-500 focus:ring-orange-500',
            )}
          />
          {(isChecking || availability) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getStatusIcon()}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={generateUsername}
          disabled={isChecking || disabled || !displayName.trim()}
          className="flex-shrink-0"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Generate'
          )}
        </Button>
      </div>
      {statusText && (
        <p
          className={cn(
            'text-xs',
            availability === 'available' && 'text-green-600',
            availability === 'taken' && 'text-red-600',
            availability === 'invalid' && 'text-orange-600',
            isChecking && 'text-muted-foreground',
          )}
        >
          {statusText}
        </p>
      )}
    </div>
  )
}
