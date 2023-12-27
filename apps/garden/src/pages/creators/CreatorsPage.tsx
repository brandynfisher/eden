import {
  OrderByFollowers,
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'

const CreatorsPage = () => {
  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        itemType="creator"
        filters={[OrderByFollowers, OrderByUsage, OrderByLatest]}
      />
    </div>
  )
}

export default CreatorsPage
