import LoadingIndicator from '@/components/LoadingIndicator'
import MediaDisplay from '@/components/MediaDisplay'
import { useCreation } from '@/hooks/useCreation'
import { getAspectRatio } from '@/lib/media'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
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
      {creation === null ? (
        <div className="h-64 w-64 max-w-full max-h-full dark:text-gray-500 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
          deleted
        </div>
      ) : null}
      {creation ? (
        <div>
          <div
            onClick={openDetailModal}
            className="flex flex-col gap-4 cursor-pointer h-full w-full mb-4"
          >
            <div>
              <div title={creation.task?.config.text_input || ''}>
                <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
                  <strong className="dark:text-gray-200 mr-1">
                    /{creation.task?.generator.generatorName}
                  </strong>
                  {creation.task?.config.text_input || ''}
                </span>
              </div>
            </div>
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
        </div>
      ) : (
        <>{isLoading ? <LoadingIndicator /> : null}</>
      )}
    </>
  )
}

export default ResultPreviewDisplay
