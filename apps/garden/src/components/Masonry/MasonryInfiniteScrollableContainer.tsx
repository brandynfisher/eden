import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { ItemType } from '@/providers/ModalProvider'
import React, { useCallback, useEffect, useState } from 'react'

const MasonryInfiniteScrollableContainer = ({
  itemType,
  filters,
  query,
  modalContainerRef,
  modalContainerHeight,
  masonryKeySuffix,
}: {
  itemType: ItemType
  filters?: OrderByParam[]
  query?: PaginatedFeedQuery
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  masonryKeySuffix?: string
}) => {
  const [fetchStartDate, setFetchStartDate] = useState<string | undefined>()
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    filters ? filters[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${filters ? filters[0].field : OrderByDefaultParam.field}_${0}`,
  )
  const handleOrderChange = useCallback(
    (newOrderBy: OrderByParam) => {
      if (newOrderBy.field !== orderBy.field) {
        // console.log(newOrderBy)
        setOrderBy(newOrderBy)
        setKey(`${newOrderBy.field}_${renderCount}`)
      }
    },
    [orderBy.field, renderCount],
  )

  useEffect(() => {
    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => prevState + 1)
  }, [orderBy])

  if (!fetchStartDate) {
    return <LoadingIndicator />
  }

  return (
    <>
      {filters ? (
        <OrderByButtons
          params={filters}
          initialParam={filters[0]}
          onOrderChange={item => handleOrderChange(item)}
        />
      ) : null}

      <MasonryInfiniteScrollable
        masonryKeySuffix={masonryKeySuffix}
        key={key}
        itemType={itemType ? itemType : 'creation'}
        query={{ ...query, maxDate: fetchStartDate }}
        orderBy={orderBy}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </>
  )
}

export default MasonryInfiniteScrollableContainer
