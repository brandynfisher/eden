'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  params: { id: string }
}

export default function CreationsModalPage({ params: { id } }: Props) {
  const [currentId, setCurrentId] = useState(id)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollResetRef = useRef(false)

  // Sync params.id changes (from direct URL navigation) but don't reset scroll
  useEffect(() => {
    if (id !== currentId && !scrollResetRef.current) {
      setCurrentId(id)
    }
    scrollResetRef.current = false
  }, [id, currentId])

  const handleIdChange = useCallback(
    (newId: string) => {
      if (newId !== currentId) {
        // Reset scroll position when navigating via arrows
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0
          scrollResetRef.current = true
        }
        setCurrentId(newId)
      }
    },
    [currentId],
  )

  return (
    <FullScreenModal
      className="p-0 relative"
      components={{
        OverlayComponent: () => (
          <ArrowNavigation basePath="/creations" onIdChange={handleIdChange} />
        ),
      }}
      scrollRef={scrollRef}
    >
      <CreationDetail
        key={currentId}
        id={currentId}
        isModal={true}
        scrollRef={scrollRef}
      />
    </FullScreenModal>
  )
}
