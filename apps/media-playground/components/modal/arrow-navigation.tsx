'use client'

import { Button } from '@/components/ui/button'
import { useCreationDetailModalStore } from '@/zustand/creation-detail-modal-store'
import { useFeedStore } from '@/zustand/feed-store'
import { useActiveFeedStore } from '@/zustand/feed-store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useCallback, useEffect } from 'react'

interface ArrowNavigationProps {
  basePath: string
  onIdChange: (id: string) => void
}

const ArrowNavigation = ({ basePath, onIdChange }: ArrowNavigationProps) => {
  const { getActiveFeedId } = useActiveFeedStore()
  const activeFeedId = getActiveFeedId()
  const feedStore = useFeedStore(activeFeedId || 'default')
  const { items, activeIndexMap, goNext, goPrevious } = feedStore
  const activeIndex = activeIndexMap[activeFeedId || 'default'] ?? null
  const queryClient = useQueryClient()
  const closeModal = useCreationDetailModalStore(state => state.close)
  const setInitialCreation = useCreationDetailModalStore(
    state => state.setInitialCreation,
  )

  const handleNext = useCallback(async () => {
    if (activeIndex === null || !items[activeIndex]) return

    const nextItem = items[activeIndex + 1]
    if (!nextItem) return

    // Seed cache FIRST for instant thumbnail display
    queryClient.setQueryData(['creations', nextItem._id], {
      creation: nextItem,
    })

    setInitialCreation(nextItem as CreationV2)

    // Invalidate immediately so full query runs to get complete data
    queryClient.invalidateQueries({ queryKey: ['creations', nextItem._id] })

    // Update state immediately for instant UI
    onIdChange(nextItem._id)

    // Update feed index
    goNext()

    // Update URL (non-blocking)
    window.history.replaceState(
      window.history.state,
      '',
      `${basePath}/${nextItem._id}`,
    )
  }, [activeIndex, goNext, items, basePath, queryClient, onIdChange])

  const handlePrevious = useCallback(() => {
    if (activeIndex === null || !items[activeIndex]) return

    const previousItem = items[activeIndex - 1]
    if (!previousItem) return

    // Seed cache FIRST for instant thumbnail display
    queryClient.setQueryData(['creations', previousItem._id], {
      creation: previousItem,
    })

    setInitialCreation(previousItem as CreationV2)

    // Invalidate immediately so full query runs to get complete data
    queryClient.invalidateQueries({ queryKey: ['creations', previousItem._id] })

    // Update state immediately for instant UI
    onIdChange(previousItem._id)

    // Update feed index
    goPrevious()

    // Update URL (non-blocking)
    window.history.replaceState(
      window.history.state,
      '',
      `${basePath}/${previousItem._id}`,
    )
  }, [activeIndex, goPrevious, items, basePath, queryClient, onIdChange])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore key repeat events (when key is held down)
      if (e.repeat) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        await handleNext()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        handlePrevious()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [handlePrevious, handleNext, closeModal])

  if (activeIndex === null || !items[activeIndex]) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        className="fixed top-1/2 left-0 size-16 z-[999] hidden md:block disabled:pointer-events-auto disabled:hover:bg-background disabled:hover:text-foreground"
        onClick={handlePrevious}
        disabled={activeIndex <= 0}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        variant="outline"
        className="fixed top-1/2 right-0 ml-auto z-[999] size-16 hidden md:block disabled:pointer-events-auto disabled:hover:bg-background disabled:hover:text-foreground"
        onClick={handleNext}
        disabled={activeIndex + 1 >= items.length}
      >
        <ArrowRightIcon />
      </Button>
    </>
  )
}

export default ArrowNavigation
