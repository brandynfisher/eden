import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { ItemType } from '@/providers/ModalProvider'
import React, { useCallback, useEffect, useState } from 'react'

// import FeedFilter from '@/components/Search/FeedFilter'
// import { FeedSettingsContext, FilterName } from '@/providers/FeedSettingsProvider'

const MasonryInfiniteScrollableContainer = ({
  itemType,
  orderParams,
  query,
  modalContainerRef,
  modalContainerHeight,
  masonryKeySuffix,
}: {
  itemType: ItemType
  orderParams?: OrderByParam[]
  query?: PaginatedFeedQuery
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  masonryKeySuffix?: string
}) => {
  // const [feedFilters, setFeedFilters] = useState({})
  const [fetchStartDate, setFetchStartDate] = useState<string | undefined>()
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    orderParams ? orderParams[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${orderParams ? orderParams[0].field : OrderByDefaultParam.field}_${0}`,
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

  // const { filters } = useContext(FeedSettingsContext)
  useEffect(() => {
    // console.log(' ===== useEffect::orderBy+feedFilters')
    // let activeFilters = {}
    //
    // filters.map(filter => {
    //   Object.entries(filter).map(items => {
    //     let values: FilterName[] = []
    //     // console.log({ type: items[0], items: items[1] })
    //     Object.entries(items[1]).map(item => {
    //       // item[0]
    //       if (item[1] === true) {
    //         values.push(item[0] as FilterName)
    //       }
    //     })
    //
    //     // @ts-ignore
    //     activeFilters[items[0]] = values
    //   })
    // })
    //
    // console.log(activeFilters)
    // setFeedFilters(activeFilters)
    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => {
      setKey(`${orderBy.field}_${prevState + 1}`)
      return prevState + 1
    })
  }, [orderBy, setRenderCount])

  if (!fetchStartDate) {
    return <LoadingIndicator />
  }

  return (
    <>
      <div className="flex justify-between mb-4">
        {orderParams ? (
          <OrderByButtons
            params={orderParams}
            initialParam={orderParams[0]}
            onOrderChange={item => handleOrderChange(item)}
          />
        ) : null}

        {/*{itemType && itemType === 'creation' ? <FeedFilter containerRef={modalContainerRef}/> : null}*/}
      </div>

      <MasonryInfiniteScrollable
        masonryKeySuffix={masonryKeySuffix}
        key={key}
        itemType={itemType ? itemType : 'creation'}
        query={{
          ...query,
          // ...feedFilters,
          maxDate: fetchStartDate,
        }}
        orderBy={orderBy}
        modalContainerRef={modalContainerRef}
        modalContainerHeight={modalContainerHeight}
      />
    </>
  )
}

export default MasonryInfiniteScrollableContainer
