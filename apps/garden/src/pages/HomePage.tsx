import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import {
  OrderByBookmarks,
  OrderByFollowing,
  OrderByLatest,
  OrderByPraises, // OrderByScore,
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
        OrderByPraises,
        OrderByBookmarks,
        OrderByFollowing,
      ]
    : [
        // OrderByScore,
        OrderByLatest,
      ]

  return (
    <div className={`flex flex-col max-w-[calc(100vw_-_32px)]`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="creations"
        itemComponent={CreationCard}
      />
    </div>
  )
}

export default HomePage
