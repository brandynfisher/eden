import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByFollowing,
  OrderByLatest,
  OrderByPopularity, // OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfinite from '@/components/Masonry/MasonryInfinite'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const sortButtons = isAuthenticated
    ? [OrderByLatest, OrderByPopularity, OrderByFollowing]
    : [OrderByLatest, OrderByPopularity]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="creations"
        ItemComponent={CreationCard}
      />
    </div>
  )
}
export default HomePage
