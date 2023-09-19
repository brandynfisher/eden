import LoadingIndicator from '@/components/LoadingIndicator'
import MediaDisplay from '@/components/MediaDisplay'
import { useCreation } from '@/hooks/useCreation'
import { getAspectRatio } from '@/lib/media'
import { getModalUrls } from '@/lib/modal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const ResultPreviewDisplay = ({ creationId }: { creationId: string }) => {
  const router = useRouter()
  const { creation, isLoading } = useCreation(creationId)

  const { pageUrl, modalUrl } = getModalUrls(router, 'creation', creationId)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CREATION_DETAIL_MODAL, {
      creation: creation ? creation : undefined,
      loadSimilar: false,
      usesUrl: true,
    })
  }

  return (
    <div className="cursor-pointer">
      {creation && !isLoading ? (
        <div
          onClick={openDetailModal}
          className="flex flex-col items-center gap-4"
        >
          <Button>Show Details</Button>
          <MediaDisplay
            creationUri={creation.uri}
            previewUri={creation.thumbnail}
            aspectRatio={getAspectRatio(
              creation.mediaAttributes.width,
              creation.mediaAttributes.height,
            )}
          />
        </div>
      ) : (
        <LoadingIndicator />
      )}
    </div>
  )
}

export default ResultPreviewDisplay
