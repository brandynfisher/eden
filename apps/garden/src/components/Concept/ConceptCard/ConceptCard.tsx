import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import { getModalUrls } from '@/lib/modal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

const ConceptCard = ({ index, data }: { index: number; data: Concept }) => {
  const [concept /*setConcept*/] = useState(data)
  const router = useRouter()
  const { pageUrl, modalUrl } = getModalUrls(router, 'concept', concept._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CONCEPT_DETAIL_MODAL, {
      concept: concept,
      usesUrl: true,
    })
  }

  return (
    <div className="relative " key={index} onClick={openDetailModal}>
      <div className="w-full flex justify-center">
        <div className="relative rounded-lg overflow-hidden cursor-pointer">
          <ConceptCardDetail concept={concept} isOverlay={true} />
          <ImageResult fullSizeUrl={concept.thumbnail || ''} />
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
