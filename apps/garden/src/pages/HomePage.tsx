import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByFollowing,
  OrderByLatest,
  OrderByPopularity,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfinite from '@/components/MasonryInfinite'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const sortButtons = isAuthenticated
    ? [
        // OrderByScore,
        OrderByLatest,
        OrderByPopularity,
        OrderByFollowing,
      ]
    : [
        // OrderByScore,
        OrderByLatest,
        OrderByPopularity,
      ]

  return (
    <div className={`flex flex-col max-w-[calc(100vw_-_32px)]`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="creations"
        ItemComponent={CreationCard}
      />
    </div>
  )
}
export default HomePage
