'use client'

import { useLayoutEffect, useRef } from 'react'

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
  // Track if this is the first render
  const isInitialRender = useRef(true)

  useLayoutEffect(() => {
    if (!textAreaRef) return

    // Skip resizing on initial render if the textarea is empty or has minimal content
    // This prevents the jarring effect of height changes on initial render
    if (isInitialRender.current) {
      if (!triggerAutoSize || triggerAutoSize.trim() === '') {
        isInitialRender.current = false
        // Set initial height to minHeight and exit
        textAreaRef.style.height = `${minHeight}px`
        return
      }
    }

    // After first render, we'll always process resize
    isInitialRender.current = false

    // Find the scrollable container (Sheet)
    const scrollContainer = textAreaRef.closest('[role="dialog"]')
    let scrollTop = 0

    // Store the current scroll position if container exists
    if (scrollContainer) {
      scrollTop = scrollContainer.scrollTop
    }

    // Always start with minHeight
    textAreaRef.style.height = `${minHeight}px`

    // Only grow if content requires it
    const scrollHeight = textAreaRef.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    textAreaRef.style.height = `${newHeight}px`

    // Restore the scroll position if container exists
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollTop
    }
  }, [textAreaRef, triggerAutoSize, minHeight, maxHeight])
}
