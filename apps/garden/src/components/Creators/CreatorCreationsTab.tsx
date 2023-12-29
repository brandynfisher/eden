import {
  OrderByLatest,
  OrderByLikedByMe,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import ModalMasonry from '@/components/Masonry/ModalMasonry'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const CreatorCreationsTab = ({
  creatorId,
  modalContainerRef,
  modalContainerHeight,
}: {
  creatorId: string
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const { isAuthenticated, isAuthenticating, userId } = useContext(UserContext)

  if (!isAuthenticated && isAuthenticating) {
    return <LoadingIndicator />
  }

  const filters =
    isAuthenticated && userId === creatorId
      ? [OrderByLatest, OrderByLikedByMe]
      : [OrderByLatest]

  return (
    <div className="mt-4 ">
      <ModalMasonry
        itemType="creation"
        key={`creations_${creatorId}`}
        filters={filters}
        query={{ userId: creatorId }}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </div>
  )
}

export default CreatorCreationsTab
