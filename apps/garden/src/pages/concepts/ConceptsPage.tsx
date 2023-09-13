import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import MasonryInfinite from '@/components/MasonryInfinite'
import { OrderByLatest } from '@/components/OrderByButtons'
import { UserContext } from '@/providers/UserProvider'
import { useContext } from 'react'

const ConceptsPage = () => {
  const { isConnected, isAuthenticated } = useContext(UserContext)

  const sortButtons =
    isConnected && isAuthenticated ? [OrderByLatest] : [OrderByLatest]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfinite
        hasSort={sortButtons}
        type="concepts"
        itemComponent={ConceptCard}
      />
    </div>
  )
}

export default ConceptsPage
