import LoadingIndicator from '@/components/LoadingIndicator'
import MediaDisplay from '@/components/MediaDisplay'
import { useCreation } from '@/hooks/useCreation'
import { getAspectRatio } from '@/lib/media'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Button } from 'antd'
import React from 'react'

const ResultPreviewDisplay = ({ creationId }: { creationId: string }) => {
  const { creation, isLoading } = useCreation(creationId)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
      creation: creation ? creation : undefined,
      loadSimilar: false,
      usesUrl: true,
    })
  }

  return (
    <>
      {creation && !isLoading ? (
        <div
          onClick={openDetailModal}
          className="flex flex-col gap-4 cursor-pointer h-full w-full"
        >
          <div className="mb-4">
            <div title={creation.task?.config.text_input || ''}>
              <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                <strong className="dark:text-gray-200 mr-1">
                  /{creation.task?.generator.generatorName}
                </strong>
                {creation.task?.config.text_input || ''}
              </span>
            </div>
          </div>
          <Button>Show Details</Button>
          <MediaDisplay
            creationUri={creation.uri}
            previewUri={creation.uri}
            thumbnailUri={creation.thumbnail}
            aspectRatio={getAspectRatio(
              creation.mediaAttributes.width,
              creation.mediaAttributes.height,
            )}
          />
        </div>
      ) : (
        <LoadingIndicator />
      )}
    </>
  )
}

export default ResultPreviewDisplay
