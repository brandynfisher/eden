import CreationMasonry from '@/components/Creation/CreationMasonry'
import {
  OrderByBookmarks,
  OrderByFollowing,
  OrderByLatest,
  OrderByPraises,
} from '@/components/OrderByButtons'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const HomePage = () => {
  const { isConnected, isAuthenticated } = useContext(UserContext)

  const sortButtons =
    isConnected && isAuthenticated
      ? [OrderByLatest, OrderByPraises, OrderByBookmarks, OrderByFollowing]
      : [OrderByLatest, OrderByPraises, OrderByBookmarks]

  return (
    <div className={`flex flex-col min-h-screen`}>
      <CreationMasonry hasSort={sortButtons} />
    </div>
  )
}

export default HomePage
