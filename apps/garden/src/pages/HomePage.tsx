import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByFollowing,
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const filters = isAuthenticated
    ? [OrderByScore, OrderByLatest, OrderByPopularity, OrderByFollowing]
    : [OrderByScore, OrderByLatest, OrderByPopularity]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        type="creations"
        ItemComponent={CreationCard}
        filters={filters}
      />
    </div>
  )
}
export default HomePage
