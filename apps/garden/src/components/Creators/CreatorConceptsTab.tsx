import {
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import ModalMasonry from '@/components/Masonry/ModalMasonry'
import React from 'react'

const CreatorConceptsTab = ({
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
        masonryKeySuffix={`userId_${creatorId}`}
        key={`concepts_${creatorId}`}
        itemType={'concept'}
        orderParams={[OrderByLatest, OrderByUsage]}
        query={{ userId: creatorId }}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
        hasFeedFilter={false}
      />
    </div>
  )
}

export default CreatorConceptsTab
