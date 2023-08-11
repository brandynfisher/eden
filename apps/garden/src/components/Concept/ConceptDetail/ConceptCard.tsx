import ConceptCardHoverOverlay from '@/components/Concept/ConceptCard/ConceptCardHoverOverlay'
import ConceptCardPreview from '@/components/Concept/ConceptCard/ConceptCardPreview'
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
  const { pageUrl, modalUrl } = getModalUrls(router, concept._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CONCEPT_DETAIL_MODAL, { concept })
  }

  return (
    <div>
      <div className="relative " key={index}>
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative rounded-lg overflow-hidden cursor-pointer"
          >
            <ConceptCardPreview concept={concept} hovered={hovered} />
            {hovered && (
              <ConceptCardHoverOverlay
                concept={concept}
                handlers={{ onChange: setConcept, openDetailModal }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
