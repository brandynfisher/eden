import CreationMasonryInfinite from '@/components/Creation/CreationMasonryInfinite'
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
  const { isConnected, isAuthenticated } = useContext(UserContext)

  const sortButtons =
    isConnected && isAuthenticated
      ? [
          OrderByScore,
          OrderByLatest,
          OrderByPraises,
          OrderByBookmarks,
          OrderByFollowing,
        ]
      : [OrderByScore, OrderByLatest, OrderByPraises, OrderByBookmarks]

  return (
    <div className={`flex flex-col min-h-screen`}>
      <CreationMasonryInfinite hasSort={sortButtons} />
    </div>
  )
}

export default HomePage
