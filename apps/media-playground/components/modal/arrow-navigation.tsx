'use client'

import { Button } from '@/components/ui/button'
import { useFeedStore } from '@/zustand/feed-store'
import { useActiveFeedStore } from '@/zustand/feed-store'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'

interface ArrowNavigationProps {
  basePath: string
  onIdChange: (id: string) => void
}

const ArrowNavigation = ({ basePath, onIdChange }: ArrowNavigationProps) => {
  const { getActiveFeedId, removeLastFromHistory } = useActiveFeedStore()
  const activeFeedId = getActiveFeedId()
  const feedStore = useFeedStore(activeFeedId || 'default')
  const { items, activeIndexMap, goNext, goPrevious } = feedStore
  const activeIndex = activeIndexMap[activeFeedId || 'default'] ?? null
  const pathname = usePathname()

  const handleNext = useCallback(async () => {
    if (activeIndex === null || !items[activeIndex]) {
      return
    }

    await goNext()
    const nextItem = items[activeIndex + 1]
    if (nextItem) {
      const newPath = `${basePath}/${nextItem._id}`
      window.history.replaceState({}, '', newPath)
      onIdChange(nextItem._id)
    }
  }, [activeIndex, goNext, items, onIdChange, basePath])

  const handlePrevious = useCallback(() => {
    if (activeIndex === null || !items[activeIndex]) {
      return
    }

    goPrevious()
    const previousItem = items[activeIndex - 1]
    if (previousItem) {
      const newPath = `${basePath}/${previousItem._id}`
      window.history.replaceState({}, '', newPath)
      onIdChange(previousItem._id)
    }
  }, [activeIndex, goPrevious, items, onIdChange, basePath])

  useEffect(() => {
    const id = pathname?.split('/').pop()
    if (id) {
      onIdChange(id)
    }
  }, [pathname, onIdChange])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        await handleNext()
      }
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      }
      if (e.key === 'Escape') {
        removeLastFromHistory()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [handlePrevious, handleNext, removeLastFromHistory])

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
