'use client'

import FullScreenModal from '@/components/modal/full-screen-modal'
import { Button } from '@/components/ui/button'
import ModelDetail from '@/features/detail/model-detail'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  params: { id: string }
}

const ArrowNavigation = ({
  onIdChange,
}: {
  onIdChange: (id: string) => void
}) => {
  const { getActiveFeedId } = useActiveFeedStore()
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
      const newPath = `/models/${nextItem._id}`
      window.history.replaceState({}, '', newPath)
      onIdChange(nextItem._id)
    }
  }, [activeIndex, goNext, items, onIdChange])

  const handlePrevious = useCallback(() => {
    if (activeIndex === null || !items[activeIndex]) {
      return
    }

    goPrevious()
    const previousItem = items[activeIndex - 1]
    if (previousItem) {
      const newPath = `/models/${previousItem._id}`
      window.history.replaceState({}, '', newPath)
      onIdChange(previousItem._id)
    }
  }, [activeIndex, goPrevious, items, onIdChange])

  useEffect(() => {
    const id = pathname.split('/').pop()
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
        const { removeLastFromHistory } = useActiveFeedStore.getState()
        removeLastFromHistory()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePrevious, handleNext])

  if (activeIndex === null || !items[activeIndex]) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        className="fixed top-1/2 left-0 size-16 z-[999] hidden md:block  disabled:pointer-events-auto disabled:hover:bg-background disabled:hover:text-foreground"
        onClick={handlePrevious}
        disabled={activeIndex <= 0}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        variant="outline"
        className="fixed top-1/2 right-0 ml-auto z-[999] size-16 hidden md:block  disabled:pointer-events-auto disabled:hover:bg-background disabled:hover:text-foreground"
        onClick={handleNext}
        disabled={!items[activeIndex + 1]}
      >
        <ArrowRightIcon />
      </Button>
    </>
  )
}

export default function ModelsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)

  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{
          OverlayComponent: () => <ArrowNavigation onIdChange={setCurrentId} />,
        }}
      >
        <ModelDetail id={currentId} isModal={true} />
      </FullScreenModal>
    </>
  )
}
