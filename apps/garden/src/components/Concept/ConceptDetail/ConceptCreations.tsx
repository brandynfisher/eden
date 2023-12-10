import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptCreations = ({ concept }: { concept: Concept }) => {
  const { showModal } = useModalContext()

  const openDetailModal = async (creation: Creation) => {
    showModal(MODAL_TYPES.CREATION_DETAIL_STATIC_MODAL, {
      creation: creation ? creation : undefined,
      loadSimilar: false,
      usesUrl: true,
    })
  }

  return (
    <div className="mt-2 md:mt-4">
      <div className="px-2 mb-2 md:mb-0 rounded-lg justify-between">
        <div className="my-2 text-gray-400 text-xs">
          Latest Public Creations
        </div>
        <MasonryInfiniteScrollable
          itemType="creation"
          ItemComponent={CreationCard}
          query={{ conceptId: concept._id }}
          onCardClick={creation => openDetailModal(creation as Creation)}
        />
      </div>
    </div>
  )
}

export default ConceptCreations
