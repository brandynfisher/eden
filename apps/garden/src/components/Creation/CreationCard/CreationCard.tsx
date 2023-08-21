import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CreationCardHoverOverlay from '@/components/Creation/CreationCard/CreationCardHoverOverlay'
import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import { getModalUrls } from '@/lib/modal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'

const CreationCard: FC<{ index: number; data: Creation }> = ({
  index,
  data,
}) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [creation, setCreation] = useState(data)
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
    useState(false)

  const { pageUrl, modalUrl } = getModalUrls(router, 'creation', creation._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(
      MODAL_TYPES.CREATION_DETAIL_MODAL,
      {
        creation,
        loadSimilar: true,
      },
      true,
    )
  }

  return (
    <div>
      <div className="relative " key={index}>
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative rounded-lg overflow-hidden cursor-pointer"
          >
            <MediaPreview creation={creation} hovered={hovered} />
            {hovered && (
              <CreationCardHoverOverlay
                creation={creation}
                handlers={{ onChange: setCreation, openDetailModal }}
              />
            )}
          </div>
        </div>
      </div>
      <AddToCollectionModal
        open={addToCollectionModalOpen}
        setOpen={setAddToCollectionModalOpen}
        creation={creation}
      />
    </div>
  )
}

export default CreationCard
