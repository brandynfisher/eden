import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { OrderByLatest } from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { UserContext } from '@/providers/UserProvider'
import React, { useContext } from 'react'

const ConceptsPage = () => {
  const { isAuthenticated } = useContext(UserContext)

  const filters = isAuthenticated ? [OrderByLatest] : [OrderByLatest]

  return (
    <div className={`flex flex-col`}>
      <MasonryInfiniteContainer
        type="concepts"
        ItemComponent={ConceptCard}
        filters={filters}
      />
    </div>
  )
}

export default ConceptsPage
