import {
  OrderByFeatured,
  OrderByFollowing,
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const CreationsFeed = () => {
  const { isAuthenticated, isAuthenticating } = useContext(UserContext)

  if (!isAuthenticated && isAuthenticating) {
    return <LoadingIndicator />
  }

  const filters = process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
    ? [OrderByFeatured]
    : []

  filters.push(OrderByScore, OrderByLatest, OrderByPopularity)
  isAuthenticated && filters.push(OrderByFollowing)

  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        itemType="creation"
        orderParams={filters}
        fallbackOrderParam={OrderByLatest}
        query={{ limit: 35 }}
      />
    </div>
  )
}

export default CreationsFeed
