import {
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import ModalMasonry from '@/components/Masonry/ModalMasonry'
import React from 'react'

const CreatorCharactersTab = ({
  creatorId,
  modalContainerRef,
  modalContainerHeight,
}: {
  creatorId: string
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  return (
    <div className="mt-4">
      <ModalMasonry
        key={`characters_${creatorId}`}
        itemType={'character'}
        filters={[OrderByLatest, OrderByUsage]}
        query={{ userId: creatorId }}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </div>
  )
}

export default CreatorCharactersTab
