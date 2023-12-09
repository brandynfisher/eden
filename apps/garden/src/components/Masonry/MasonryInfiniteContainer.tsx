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
}: {
  itemType: ItemType
  ItemComponent: typeof CreationCard | typeof ConceptCard
  filters?: OrderByParam[]
  query?: PaginatedFeedQuery
}) => {
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    filters ? filters[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${filters ? filters[0].field : OrderByDefaultParam.field}_${0}`,
  )

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

  return (
    <>
      {filters ? (
        <OrderByButtons
          params={filters}
          onOrderChange={item => handleOrderChange(item)}
        />
      ) : null}

      <MasonryInfinite
        key={key}
        orderBy={orderBy}
        itemType={itemType}
        query={query}
        ItemComponent={ItemComponent}
      />
    </>
  )
}

export default MasonryInfiniteContainer
