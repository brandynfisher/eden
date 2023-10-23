import LoadingIndicator from '@/components/LoadingIndicator'
import MediaDisplay from '@/components/MediaDisplay'
import { useCreation } from '@/hooks/useCreation'
import { getAspectRatio } from '@/lib/media'
import { timeAgo } from '@/lib/time'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import React from 'react'

const ResultPreviewDisplay = ({
  creationId,
  taskCost,
}: {
  creationId: string
  taskCost: number
}) => {
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
            className="flex flex-col gap-2 cursor-pointer h-full w-full"
          >
            <div>
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center">
                  <strong className=" text-sm dark:text-gray-200">
                    /{creation.task?.generator.generatorName}
                  </strong>
                  <div
                    className="text-gray-700 dark:text-gray-400 text-xs"
                    title={timeAgo(creation.task.createdAt)}
                  >
                    <span className="mx-1">•</span>
                    {timeAgo(creation.task.createdAt)}
                  </div>
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-400">
                  <strong>{taskCost}</strong> Manna
                </div>
              </div>
              <div title={creation.task?.config.text_input || ''}>
                <span className="relative first-letter:uppercase text-xs select-text cursor-text text-ellipsis dark:text-gray-400 break-words line-clamp-2">
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
