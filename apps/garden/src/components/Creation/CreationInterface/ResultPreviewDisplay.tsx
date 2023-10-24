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
        <div onClick={openDetailModal} className="cursor-pointer h-full w-full">
          <MediaDisplay
            creationUri={creation.uri}
            previewUri={creation.uri}
            thumbnailUri={creation.thumbnail}
            aspectRatio={getAspectRatio(
              creation.mediaAttributes.width,
              creation.mediaAttributes.height,
            )}
            priority={false}
          />
        </div>
      ) : (
        <>{isLoading ? <LoadingIndicator /> : null}</>
      )}
    </>
  )
}

export default ResultPreviewDisplay
