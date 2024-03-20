import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteScrollableContainer from '@/components/Masonry/MasonryInfiniteScrollableContainer'
import { ItemType } from '@/providers/ModalProvider'
import React from 'react'

const ModalMasonry = ({
  title,
  itemType,
  query,
  modalContainerRef,
  modalContainerHeight,
  masonryKeySuffix,
  orderParams,
  hasFeedFilter,
}: {
  title?: string
  itemType?: ItemType
  query: {
    userId?: string
    conceptId?: string
    creationId?: string
    characterId?: string
    creatorId?: string
  }
  orderParams?: OrderByParam[]
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  masonryKeySuffix?: string
  hasFeedFilter?: boolean
}) => {
  return (
    <div className="mt-2 md:mt-4">
      <div className="px-2 mb-2 md:mb-0 rounded-lg justify-between">
        {title ? (
          <div className="my-2 text-gray-400 text-xs">{title}</div>
        ) : null}
        <MasonryInfiniteScrollableContainer
          masonryKeySuffix={masonryKeySuffix}
          itemType={itemType || 'creation'}
          query={query}
          orderParams={orderParams}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
          hasFeedFilter={hasFeedFilter}
        />
      </div>
    </div>
  )
}

export default ModalMasonry
