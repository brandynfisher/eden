'use client'

import { useAutosizeTextArea } from '@/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { useImperativeHandle } from 'react'

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement
  focus: () => void
  maxHeight: number | undefined
  minHeight: number
  resize: () => void
}

type AutosizeTextAreaProps = {
  maxHeight?: number
  minHeight?: number
  variant?: 'sm' | 'md' | 'lg' | 'xl'
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

const getMaxHeight = (variant?: 'sm' | 'md' | 'lg' | 'xl') => {
  // Heights for desktop/tablet
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    switch (variant) {
      case 'sm':
        return 100 // ~4-5 lines
      case 'md':
        return 200 // ~8-10 lines
      case 'lg':
        return 400 // ~16-20 lines
      case 'xl':
        return 600 // ~24-30 lines
      default:
        return 64 // default to md
    }
  }
  // Heights for mobile
  switch (variant) {
    case 'sm':
      return 80 // ~3-4 lines
    case 'md':
      return 160 // ~6-8 lines
    case 'lg':
      return 240 // ~10-12 lines
    case 'xl':
      return 320 // ~14-16 lines
    default:
      return 64 // default to md
  }
}

export const AutosizeTextarea = React.forwardRef<
  AutosizeTextAreaRef,
  AutosizeTextAreaProps
>(
  (
    {
      maxHeight: propMaxHeight,
      minHeight = 64,
      variant = 'md',
      className,
      onChange,
      value,
      defaultValue,
      ...props
    }: AutosizeTextAreaProps,
    ref: React.Ref<AutosizeTextAreaRef>,
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const [triggerAutoSize, setTriggerAutoSize] = React.useState<string>('')
    const isInitialMount = React.useRef(true)

    const maxHeight = propMaxHeight || getMaxHeight(variant)

    useAutosizeTextArea({
      textAreaRef: textAreaRef.current,
      triggerAutoSize,
      maxHeight,
      minHeight,
    })

    // Manual resize function that can be called externally
    const manualResize = React.useCallback(() => {
      if (textAreaRef.current) {
        const currentValue = textAreaRef.current.value
        setTriggerAutoSize(currentValue)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      textArea: textAreaRef.current as HTMLTextAreaElement,
      focus: () => textAreaRef.current?.focus(),
      maxHeight,
      minHeight,
      resize: manualResize,
    }))

    // Handle value changes from props - but skip empty values on initial render
    React.useEffect(() => {
      if (isInitialMount.current && (!value || value === '')) {
        return
      }

      if (value !== undefined) {
        setTriggerAutoSize(value as string)
      }
    }, [value])

    // Handle defaultValue on mount - but only if it has content
    React.useEffect(() => {
      if (defaultValue && defaultValue !== '' && textAreaRef.current) {
        setTriggerAutoSize(defaultValue as string)
      }
    }, [defaultValue])

    // Mark initial mount as complete after first render
    React.useEffect(() => {
      isInitialMount.current = false
    }, [])

    // Force resize on mount only if there's actual content
    React.useEffect(() => {
      if (
        textAreaRef.current &&
        textAreaRef.current.value &&
        textAreaRef.current.value.trim() !== ''
      ) {
        // Small delay to ensure the DOM is fully rendered
        const timer = setTimeout(() => {
          manualResize()
        }, 0)

        return () => clearTimeout(timer)
      }
    }, [manualResize])

    return (
      <textarea
        {...props}
        value={value}
        defaultValue={defaultValue}
        ref={textAreaRef}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className,
        )}
        onChange={e => {
          // Only trigger resize if there's actual content
          if (e.target.value.trim() !== '') {
            setTriggerAutoSize(e.target.value)
          } else {
            // For empty values, reset to minHeight without triggering the resize logic
            if (textAreaRef.current) {
              textAreaRef.current.style.height = `${minHeight}px`
            }
          }
          onChange?.(e)
        }}
      />
    )
  },
)
AutosizeTextarea.displayName = 'AutosizeTextarea'
