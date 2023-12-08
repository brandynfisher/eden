import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import {
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'

const ConceptsPage = () => {
  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        type="concepts"
        ItemComponent={ConceptCard}
        filters={[OrderByUsage, OrderByLatest]}
      />
    </div>
  )
}

export default ConceptsPage
