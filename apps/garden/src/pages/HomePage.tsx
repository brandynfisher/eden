import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByFollowing,
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const HomePage = () => {
  const { isAuthenticated, isAuthenticating } = useContext(UserContext)

  if (!isAuthenticated && isAuthenticating) {
    return <LoadingIndicator />
  }

  const filters = isAuthenticated
    ? [OrderByScore, OrderByLatest, OrderByPopularity, OrderByFollowing]
    : [OrderByScore, OrderByLatest, OrderByPopularity]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        itemType="creation"
        ItemComponent={CreationCard}
        filters={filters}
        fallbackFilter={OrderByLatest}
      />
    </div>
  )
}
export default HomePage
