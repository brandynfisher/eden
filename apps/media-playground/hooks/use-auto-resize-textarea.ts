// hooks/useAutosizeTextArea.ts
'use client'

import { useLayoutEffect } from 'react'

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

      const offsetBorder = 2 // Adjust if needed based on your styling

      // Reset the height to allow the textarea to shrink when needed
      textAreaRef.style.height = `${minHeight + offsetBorder}px`

      // Calculate the new height based on the scrollHeight
      const scrollHeight = textAreaRef.scrollHeight

      // Apply the new height, bounded by maxHeight
      if (scrollHeight > maxHeight) {
        textAreaRef.style.height = `${maxHeight}px`
      } else {
        textAreaRef.style.height = `${scrollHeight + offsetBorder}px`
      }

      // Restore the scroll position of the sheet
      scrollContainer.scrollTop = scrollTop
    }
  }, [textAreaRef, triggerAutoSize, minHeight, maxHeight])
}
