import {
  OrderByLatest,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import SearchBar from '@/components/Search/SearchBar'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import React, { useState } from 'react'

const CharactersPage = () => {
  const [query, setQuery] = useState<PaginatedFeedQuery>()

  return (
    <div className={`flex flex-col`}>
      <SearchBar
        onSearchSubmit={query => {
          setQuery(query)
        }}
      />

      <MasonryInfiniteContainer
        itemType="character"
        orderParams={[OrderByUsage, OrderByLatest]}
        query={query}
      />
    </div>
  )
}

export default CharactersPage
