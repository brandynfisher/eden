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
  isOwnProfile,
  modalContainerRef,
  modalContainerHeight,
}: {
  creatorId: string
  isOwnProfile?: boolean
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const { isAuthenticated, isAuthenticating } = useContext(UserContext)

  if (!isAuthenticated && isAuthenticating) {
    return <LoadingIndicator />
  }

  const filters = isOwnProfile
    ? [OrderByLatest, OrderByLikedByMe]
    : [OrderByLatest]

  return (
    <div className="mt-4 ">
      <ModalMasonry
        masonryKeySuffix={`userId_${creatorId}`}
        itemType="creation"
        key={`creations_${creatorId}`}
        orderParams={filters}
        query={{ userId: creatorId }}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
        hasFeedFilter={true}
      />
    </div>
  )
}

export default CreatorCreationsTab
