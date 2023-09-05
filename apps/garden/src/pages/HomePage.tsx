import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import MasonryInfinite from '@/components/MasonryInfinite'
import {
  OrderByBookmarks,
  OrderByFollowing,
  OrderByLatest,
  OrderByPraises,
  OrderByScore,
} from '@/components/OrderByButtons'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const sortButtons = isAuthenticated
    ? [
        OrderByScore,
        OrderByLatest,
        OrderByPraises,
        OrderByBookmarks,
        OrderByFollowing,
      ]
    : [OrderByScore, OrderByLatest, OrderByPraises, OrderByBookmarks]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="creations"
        itemComponent={CreationCard}
      />
    </div>
  )
}

export default HomePage
