import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { ProgressCard } from '@/components/Creation/CreationInterface/Timeline/TimelineItemMediaPlaceholder'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Task } from '@edenlabs/eden-sdk'
import React, { useCallback } from 'react'

const TimelineItemSample = ({
  task,
  creationId,
  listIndex,
}: {
  task: Task
  creationId: string
  listIndex: number
}) => {
  const { creation, isLoading } = useCreation(creationId, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateAll: false,
    retryOnError: false,
  })
  const { showModal } = useModalContext()

  const handleCardClick = useCallback(() => {
    showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
      creation: creation ? creation : undefined,
      loadSimilar: false,
      usesUrl: false,
    })
  }, [showModal, creation])

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
      index={listIndex || 0}
      data={creation}
      onClick={handleCardClick}
      hidePrompt={true}
      sizes={'(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw)'}
    />
  )
}

const TimelineItemMedia = ({
  task,
  listIndex,
}: {
  task: Task
  listIndex?: number
}) => {
  return (
    <>
      {task.samples && task.samples.length ? (
        <div className={`grid grid-cols-2 gap-2`}>
          {task.samples.map(id => (
            <TimelineItemSample
              key={id}
              task={task}
              creationId={id}
              listIndex={listIndex || 0}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1">
          <TimelineItemSample
            task={task}
            creationId={task.creation?._id}
            listIndex={listIndex || 0}
          />
        </div>
      )}
    </>
  )
}

export default TimelineItemMedia
