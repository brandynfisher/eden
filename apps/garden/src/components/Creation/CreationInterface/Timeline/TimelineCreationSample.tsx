import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { ProgressCard } from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Task } from '@edenlabs/eden-sdk'
import React, { useCallback } from 'react'

const TimelineCreationSample = ({
  task,
  creationId,
  listIndex,
}: {
  task: Task
  creationId: string
  listIndex: number
}) => {
  const { creation, mutate, isLoading } = useCreation(creationId, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateAll: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })
  const { showModal, hideModal } = useModalContext()

  const handleCardClick = useCallback(() => {
    if (!creation) return
    hideModal(null, MODAL_TYPES.DETAIL_STATIC_MODAL)
    showModal(MODAL_TYPES.DETAIL_STATIC_MODAL, {
      item: creation,
      itemType: 'creation',
      usesUrl: false,
    })
  }, [showModal, hideModal, creation])

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

  if (!creation) {
    return <div className="text-sm text-gray-600">deleted</div>
  }

  return (
    <CreationCard
      index={listIndex < 3 ? listIndex : 9999}
      data={creation}
      onClick={handleCardClick}
      updateHandler={() => mutate()}
      hidePrompt={true}
      sizes={'(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw)'}
    />
  )
}

export default TimelineCreationSample
