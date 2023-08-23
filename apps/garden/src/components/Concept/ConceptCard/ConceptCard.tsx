import ConceptCardHoverOverlay from '@/components/Concept/ConceptCard/ConceptCardHoverOverlay'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import { getModalUrls } from '@/lib/modal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useRouter } from 'next/router'
import { useState } from 'react'

const ConceptCard = ({ index, data }: { index: number; data: Concept }) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [concept, setConcept] = useState(data)
  const { pageUrl, modalUrl } = getModalUrls(router, 'concept', concept._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CONCEPT_DETAIL_MODAL, { concept }, true)
  }

  return (
    <div className="relative " key={index}>
      <div className="w-full flex justify-center">
        <div
          ref={ref}
          className="relative rounded-lg overflow-hidden cursor-pointer"
        >
          <ImageResult resultUrl={concept.thumbnail || ''} />
          <div className="absolute inset-0 pointer-events-none bg-gray-800 bg-opacity-70">
            {concept.conceptName}
          </div>
          {hovered && (
            <ConceptCardHoverOverlay
              concept={concept}
              handlers={{ onChange: setConcept, openDetailModal }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
