'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'
import { useCallback, useEffect, useRef, useState } from 'react'

interface CreationDetailModalProps {
  isOpen: boolean
  creationId: string | null
  onClose: () => void
}

export default function CreationDetailModal({
  isOpen,
  creationId,
  onClose,
}: CreationDetailModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentId, setCurrentId] = useState(creationId)

  // Update currentId when creationId prop changes
  useEffect(() => {
    if (creationId) {
      setCurrentId(creationId)
    }
  }, [creationId])

  // Update URL when modal opens for sharing/back button
  useEffect(() => {
    if (isOpen && currentId) {
      window.history.pushState(null, '', `/creations/${currentId}`)
    }
  }, [isOpen, currentId])

  const handleIdChange = useCallback(
    (newId: string) => {
      if (newId !== currentId) {
        // Reset scroll when changing creations
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0
        }
        setCurrentId(newId)

        // Update URL for sharing/back button
        window.history.replaceState(
          window.history.state,
          '',
          `/creations/${newId}`,
        )
      }
    },
    [currentId],
  )

  if (!isOpen || !currentId) return null

  return (
    <FullScreenModal
      className="p-0 relative"
      open={isOpen}
      onClose={onClose}
      components={{
        OverlayComponent: () => (
          <ArrowNavigation basePath="/creations" onIdChange={handleIdChange} />
        ),
      }}
      scrollRef={scrollRef}
    >
      <CreationDetail id={currentId} isModal={true} scrollRef={scrollRef} />
    </FullScreenModal>
  )
}
