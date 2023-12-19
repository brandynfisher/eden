import CharacterCard from '@/components/Characters/CharacterCard'
import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfinite from '@/components/Masonry/MasonryInfinite'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { ItemType } from '@/providers/ModalProvider'
import React, { useCallback, useEffect, useState } from 'react'

const MasonryInfiniteContainer = ({
  itemType,
  ItemComponent,
  filters,
  query,
  fallbackFilter,
}: {
  itemType: ItemType
  ItemComponent: typeof CreationCard | typeof ConceptCard | typeof CharacterCard
  filters?: OrderByParam[]
  query?: PaginatedFeedQuery
  fallbackFilter?: OrderByParam
}) => {
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    filters ? filters[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${filters ? filters[0].field : OrderByDefaultParam.field}_${0}`,
  )
  const [hiddenParams, setHiddenParams] = useState<string[]>([])

  const handleOrderChange = useCallback(
    (newOrderBy: OrderByParam) => {
      if (newOrderBy.field !== orderBy?.field) {
        setOrderBy(newOrderBy)
        setKey(`${newOrderBy.field}_${renderCount}`)
      }
    },
    [renderCount],
  )

  useEffect(() => {
    setRenderCount(prevState => prevState + 1)
  }, [orderBy])

  const handleFallbackOnEmptyResult = (orderBy: OrderByParam) => {
    if (fallbackFilter) {
      setHiddenParams(prev =>
        prev.includes(orderBy.field) ? prev : [...prev, orderBy.field],
      )
      handleOrderChange(fallbackFilter)
    }
  }

  return (
    <>
      {filters ? (
        <OrderByButtons
          params={filters.filter(item => !hiddenParams.includes(item.field))}
          initialParam={
            filters.filter(item => !hiddenParams.includes(item.field))[0]
          }
          onOrderChange={item => handleOrderChange(item)}
        />
      ) : null}

      <MasonryInfinite
        key={key}
        orderBy={orderBy}
        itemType={itemType}
        query={query}
        ItemComponent={ItemComponent}
        emptyResultHandler={
          fallbackFilter ? handleFallbackOnEmptyResult : undefined
        }
      />
    </>
  )
}

export default MasonryInfiniteContainer
