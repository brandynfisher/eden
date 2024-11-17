'use client'

import FullScreenModal from '@/components/modal/full-screen-modal'
import { Button } from '@/components/ui/button'
import CreationDetail from '@/features/detail/creation-detail'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

type Props = {
  params: { id: string }
}

const ArrowNavigation = () => {
  const { activeFeedId } = useActiveFeedStore() // Get the active feedId
  const feedStore = useFeedStore(activeFeedId || 'default') // Access the appropriate feed store
  const { items, activeIndex, goNext, goPrevious } = feedStore
  const router = useRouter()
  const handleNext = useCallback(async () => {
    if (activeIndex === null || !items[activeIndex]) {
      return
    }

    await goNext()
    const nextItem = items[activeIndex + 1]
    if (nextItem) {
      router.push(`/creations/${nextItem._id}`)
    }
  }, [activeIndex, goNext, items, router])

  const handlePrevious = useCallback(() => {
    if (activeIndex === null || !items[activeIndex]) {
      return
    }

    goPrevious()
    const previousItem = items[activeIndex - 1]
    if (previousItem) {
      router.push(`/creations/${previousItem._id}`)
    }
  }, [activeIndex, goPrevious, items, router])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        await handleNext()
      }
      if (e.key === 'ArrowLeft') {
        handlePrevious()
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
        className="absolute h-16 left-0 top-1/2 z-[51] w-16"
        onClick={handlePrevious}
        disabled={activeIndex <= 0}
      >
        <ArrowLeftIcon />
      </Button>
      <div className="absolute bottom-0 bg-red-700 h-16 w-full z-[51]">
        minimap
      </div>
      <Button
        variant="outline"
        className="absolute h-16 right-0 top-1/2 z-[51] w-16"
        onClick={handleNext}
        disabled={!items[activeIndex + 1]}
      >
        <ArrowRightIcon />
      </Button>
    </>
  )
}

export default function CreationsModalPage({
  params: { id: creationId },
}: Props) {
  return (
    <>
      <FullScreenModal
        className="p-0 relative"
        components={{ OverlayComponent: ArrowNavigation }}
      >
        <CreationDetail id={creationId} isModal={true} />
      </FullScreenModal>
    </>
  )
}
