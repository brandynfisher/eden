import {
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'

const CharactersPage = () => {
  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        itemType="character"
        filters={[OrderByUsage, OrderByLatest]}
      />
    </div>
  )
}

export default CharactersPage
