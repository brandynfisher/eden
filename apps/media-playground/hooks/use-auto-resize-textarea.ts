// hooks/useAutosizeTextArea.ts
'use client'

import { useLayoutEffect } from 'react'

// hooks/useAutosizeTextArea.ts

// hooks/useAutosizeTextArea.ts

// hooks/useAutosizeTextArea.ts

interface UseAutosizeTextAreaProps {
  textAreaRef: HTMLTextAreaElement | null
  minHeight?: number
  maxHeight?: number
  triggerAutoSize: string
}

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerAutoSize,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  useLayoutEffect(() => {
    if (textAreaRef) {
      // Find the scrollable container (Sheet)
      const scrollContainer = textAreaRef.closest('[role="dialog"]')
      if (!scrollContainer) return

      // Store the current scroll position of the sheet
      const scrollTop = scrollContainer.scrollTop

      // Always start with minHeight
      textAreaRef.style.height = `${minHeight}px`

      // Only grow if content requires it
      const scrollHeight = textAreaRef.scrollHeight
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textAreaRef.style.height = `${newHeight}px`

      // Restore the scroll position of the sheet
      scrollContainer.scrollTop = scrollTop
    }
  }, [textAreaRef, triggerAutoSize, minHeight, maxHeight])
}
