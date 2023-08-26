import ConceptCardHoverOverlay from '@/components/Concept/ConceptCard/ConceptCardHoverOverlay'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import { getModalUrls } from '@/lib/modal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React from 'react'

const ConceptCard = ({ index, data }: { index: number; data: Concept }) => {
  const router = useRouter()
  const { pageUrl, modalUrl } = getModalUrls(router, 'concept', data._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CONCEPT_DETAIL_MODAL, {
      concept: data,
      usesUrl: true,
    })
  }

  return (
    <div className="relative " key={index} onClick={openDetailModal}>
      <div className="w-full flex justify-center">
        <div className="relative rounded-lg overflow-hidden cursor-pointer">
          <ImageResult resultUrl={data.thumbnail || ''} />
          <ConceptCardHoverOverlay concept={data} />
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
