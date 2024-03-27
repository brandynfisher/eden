import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import FeedFilter from '@/components/Search/FeedFilter'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { useGenerators } from '@/hooks/useGenerators'
import { storyGeneratorIds } from '@/pages/channels/ChannelsPage'
import {
  FeedSettingsContext,
  FilterName,
} from '@/providers/FeedSettingsProvider'
import { ItemType } from '@/providers/ModalProvider'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

// import FeedFilter from '@/components/Search/FeedFilter'
// import { FeedSettingsContext, FilterName } from '@/providers/FeedSettingsProvider'

const MasonryInfiniteScrollableContainer = ({
  itemType,
  orderParams,
  query,
  modalContainerRef,
  modalContainerHeight,
  masonryKeySuffix,
  hasFeedFilter,
}: {
  itemType: ItemType
  orderParams?: OrderByParam[]
  query?: PaginatedFeedQuery
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
  masonryKeySuffix?: string
  hasFeedFilter?: boolean
}) => {
  const [feedFilters, setFeedFilters] = useState({})
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

  const { generators } = useGenerators()
  const { filters } = useContext(FeedSettingsContext)
  const router = useRouter()
  const pathname = router.pathname
  useEffect(() => {
    let activeFilters = {}

    filters.map(filter => {
      Object.entries(filter).map(items => {
        let values: FilterName[] = []
        if (typeof items[1] === 'string') {
          if (items[0] === 'visibility') {
            if (pathname !== '/creators/[id]') {
              return
            }
          }

          // @ts-ignore
          activeFilters[items[0]] = items[1]
        } else {
          Object.entries(items[1]).map(item => {
            if (items[0] === 'generatorId' && item[1] === true) {
              if (item[0] === 'story') {
                values.push(...(storyGeneratorIds as FilterName[]))
                return
              }

              const matchingGenerator = generators?.filter(
                generator => generator.generatorName === item[0],
              )[0]

              if (matchingGenerator) {
                values.push(matchingGenerator._id as FilterName)
              }

              return
            }

            if (item[1] === true) {
              values.push(item[0] as FilterName)
            }
          })

          // @ts-ignore
          activeFilters[items[0]] = values
        }
      })
    })

    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => {
      // console.log(`${orderBy.field}_${prevState + 1}`, { prevState })
      setKey(`${orderBy.field}_${prevState + 1}`)
      return prevState + 1
    })
    setFeedFilters(activeFilters)
  }, [filters, pathname])

  useEffect(() => {
    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => {
      // console.log(`${orderBy.field}_${prevState + 1}`, { prevState })
      setKey(`${orderBy.field}_${prevState + 1}`)
      return prevState + 1
    })
  }, [orderBy])

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

        {hasFeedFilter && itemType && itemType === 'creation' ? (
          <FeedFilter />
        ) : null}
      </div>

      <MasonryInfiniteScrollable
        masonryKeySuffix={masonryKeySuffix}
        key={key}
        itemType={itemType ? itemType : 'creation'}
        query={{
          ...query,
          ...(hasFeedFilter ? feedFilters : {}),
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
