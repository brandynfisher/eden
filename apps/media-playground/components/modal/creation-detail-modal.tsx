'use client'

import ArrowNavigation from '@/components/modal/arrow-navigation'
import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface CreationDetailModalProps {
  isOpen: boolean
  creationId: string | null
  onClose: () => void
  initialCreation?: CreationV2
  onCreationChange?: (creationId: string) => void
}

export default function CreationDetailModal({
  isOpen,
  creationId,
  onClose,
  initialCreation,
  onCreationChange,
}: CreationDetailModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentId, setCurrentId] = useState(creationId)
  const originPathRef = useRef<string | null>(null)
  const pathname = usePathname()
  const lastPathnameRef = useRef(pathname)

  // Update currentId when creationId prop changes
  useEffect(() => {
    if (creationId) {
      setCurrentId(creationId)
    }
  }, [creationId])

  // Close the modal if a navigation occurs while it's open
  useEffect(() => {
    const previousPath = lastPathnameRef.current
    if (previousPath === pathname) return

    if (isOpen && currentId) {
      const expectedPath = `/creations/${currentId}`
      if (pathname !== expectedPath) {
        originPathRef.current = null
        onClose()
      }
    }

    lastPathnameRef.current = pathname
  }, [pathname, isOpen, currentId, onClose])

  // Update URL when modal opens for sharing/back button without triggering navigation
  useEffect(() => {
    if (isOpen && currentId) {
      if (!originPathRef.current) {
        originPathRef.current =
          window.location.pathname +
          window.location.search +
          window.location.hash
      }
      const state = window.history.state
      window.history.replaceState(state, '', `/creations/${currentId}`)
    }
  }, [isOpen, currentId])

  // Restore original URL once the modal closes
  useEffect(() => {
    if (isOpen) return
    if (!originPathRef.current) return
    const state = window.history.state
    window.history.replaceState(state, '', originPathRef.current)
    originPathRef.current = null
  }, [isOpen])

  // Cleanup in the unlikely event we unmount mid-navigation
  useEffect(() => {
    return () => {
      if (!originPathRef.current) return
      const state = window.history.state
      window.history.replaceState(state, '', originPathRef.current)
      originPathRef.current = null
    }
  }, [])

  const handleIdChange = useCallback(
    (newId: string) => {
      if (newId !== currentId) {
        // Reset scroll when changing creations
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0
        }
        setCurrentId(newId)
        onCreationChange?.(newId)

        // Update URL for sharing/back button
        const state = window.history.state
        window.history.replaceState(state, '', `/creations/${newId}`)
      }
    },
    [currentId, onCreationChange],
  )

  const hydratedInitialCreation = useMemo(() => {
    if (!initialCreation) return undefined
    return initialCreation._id === currentId ? initialCreation : undefined
  }, [initialCreation, currentId])

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
      <CreationDetail
        id={currentId}
        creationSSRData={hydratedInitialCreation}
        isModal={true}
        scrollRef={scrollRef}
      />
    </FullScreenModal>
  )
}
