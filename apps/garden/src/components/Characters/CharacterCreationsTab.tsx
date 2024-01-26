import ModalMasonry from '@/components/Masonry/ModalMasonry'
import React from 'react'

const CharacterCreationsTab = ({
  characterId,
  modalContainerRef,
  modalContainerHeight,
}: {
  characterId: string
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  return (
    <div className="mt-4">
      <ModalMasonry
        itemType={'creation'}
        masonryKeySuffix={`characterId_${characterId}`}
        key={`creations_${characterId}`}
        query={{ characterId: characterId }}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </div>
  )
}

export default CharacterCreationsTab
