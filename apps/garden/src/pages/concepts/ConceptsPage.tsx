import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { OrderByLatest } from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfinite from '@/components/Masonry/MasonryInfinite'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const ConceptsPage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const sortButtons = isAuthenticated ? [OrderByLatest] : [OrderByLatest]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="concepts"
        ItemComponent={ConceptCard}
      />
    </div>
  )
}

export default ConceptsPage
