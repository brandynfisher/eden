import CreationMasonry from '@/components/Creation/CreationMasonry'
import {
  OrderByBookmarks,
  OrderByFollowing,
  OrderByLatest,
  OrderByPraises,
} from '@/components/OrderByButtons'

const HomePage = () => {
  return (
    <div className={`flex flex-col min-h-screen`}>
      <CreationMasonry
        hasSort={[
          OrderByLatest,
          OrderByPraises,
          OrderByBookmarks,
          OrderByFollowing,
        ]}
      />
    </div>
  )
}

export default HomePage
