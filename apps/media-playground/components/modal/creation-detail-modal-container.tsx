'use client'

import CreationDetailModal from '@/components/modal/creation-detail-modal'
import { useCreationDetailModalStore } from '@/zustand/creation-detail-modal-store'
import { useEffect, useMemo } from 'react'

const CreationDetailModalContainer = () => {
  const creationId = useCreationDetailModalStore(state => state.creationId)
  const initialCreation = useCreationDetailModalStore(
    state => state.initialCreation,
  )
  const isOpen = useCreationDetailModalStore(state => state.isOpen)
  const close = useCreationDetailModalStore(state => state.close)
  const reset = useCreationDetailModalStore(state => state.reset)
  const setCreationId = useCreationDetailModalStore(
    state => state.setCreationId,
  )

  // Keep the modal mounted briefly to allow exit animations before clearing state.
  useEffect(() => {
    if (isOpen || !creationId) return

    const timeout = setTimeout(() => reset(), 200)
    return () => clearTimeout(timeout)
  }, [isOpen, creationId, reset])

  const hydratedInitialCreation = useMemo(() => {
    if (!initialCreation) return null
    if (!creationId) return null
    return initialCreation._id === creationId ? initialCreation : null
  }, [initialCreation, creationId])

  if (!creationId) {
    return null
  }

  return (
    <CreationDetailModal
      isOpen={isOpen}
      creationId={creationId}
      initialCreation={hydratedInitialCreation ?? undefined}
      onClose={close}
      onCreationChange={setCreationId}
    />
  )
}

export default CreationDetailModalContainer
