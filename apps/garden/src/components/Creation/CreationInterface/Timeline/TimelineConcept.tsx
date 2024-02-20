import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { ProgressCard } from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Task } from '@edenlabs/eden-sdk'
import React, { useCallback } from 'react'

const TimelineCreationSample = ({
  task,
  conceptId,
  listIndex,
}: {
  task: Task
  conceptId: string
  listIndex: number
}) => {
  const { concept, isLoading } = useConcept(conceptId, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateAll: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })
  const { showModal, hideModal } = useModalContext()

  const handleCardClick = useCallback(() => {
    if (!concept) return
    hideModal(null, MODAL_TYPES.DETAIL_STATIC_MODAL)
    showModal(MODAL_TYPES.DETAIL_STATIC_MODAL, {
      item: concept,
      itemType: 'concept',
      usesUrl: false,
    })
  }, [showModal, hideModal, concept])

  if (isLoading) {
    return (
      <div className="relative w-full h-full">
        <ProgressCard task={task} />
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg text-2xl">
          <LoadingIndicator />
        </div>
      </div>
    )
  }

  if (!concept) {
    return <div className="text-sm text-gray-600">deleted</div>
  }

  return (
    <ConceptCard
      index={listIndex < 3 ? listIndex : 9999}
      data={concept}
      onClick={handleCardClick}
      hidePrompt={true}
      sizes={'(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw)'}
    />
  )
}

export default TimelineCreationSample
