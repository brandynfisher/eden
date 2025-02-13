'use client'

import { useFormField } from '@/components/ui/form'
import { useAutosizeTextArea } from '@/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { useImperativeHandle } from 'react'

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement
  focus: () => void
  maxHeight: number | undefined
  minHeight: number
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
      ...props
    }: AutosizeTextAreaProps,
    ref: React.Ref<AutosizeTextAreaRef>,
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const [triggerAutoSize, setTriggerAutoSize] = React.useState<string>('')
    const { formItemId } = useFormField()

    const maxHeight = propMaxHeight || getMaxHeight(variant)

    useAutosizeTextArea({
      textAreaRef: textAreaRef.current,
      triggerAutoSize,
      maxHeight,
      minHeight,
    })

    useImperativeHandle(ref, () => ({
      textArea: textAreaRef.current as HTMLTextAreaElement,
      focus: () => textAreaRef.current?.focus(),
      maxHeight,
      minHeight,
    }))

    React.useEffect(() => {
      // Trigger autosize when the component mounts and whenever the value changes
      if (value) {
        setTriggerAutoSize(value as string)
      } else {
        setTriggerAutoSize('')
      }
    }, [value])

    return (
      <textarea
        {...props}
        id={formItemId}
        value={value}
        ref={textAreaRef}
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className,
        )}
        onChange={e => {
          setTriggerAutoSize(e.target.value)
          onChange?.(e)
        }}
      />
    )
  },
)
AutosizeTextarea.displayName = 'AutosizeTextarea'
