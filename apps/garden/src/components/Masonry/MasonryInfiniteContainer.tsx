import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfinite from '@/components/Masonry/MasonryInfinite'
import { storyGeneratorIds } from '@/components/Pages/ChannelsPage'
import FeedFilter from '@/components/Search/FeedFilter'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { useGenerators } from '@/hooks/useGenerators'
import {
  FeedSettingsContext,
  FilterName,
} from '@/providers/FeedSettingsProvider'
import { ItemType } from '@/providers/ModalProvider'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

const MasonryInfiniteContainer = ({
  itemType,
  query,
  orderParams,
  fallbackOrderParam,
  disableFilters,
}: {
  itemType: ItemType
  orderParams?: OrderByParam[]
  query?: PaginatedFeedQuery
  fallbackOrderParam?: OrderByParam
  disableFilters?: boolean
}) => {
  const { generators } = useGenerators()
  const [feedFilters, setFeedFilters] = useState({})
  const [fetchStartDate, setFetchStartDate] = useState<string | undefined>()
  const [orderBy, setOrderBy] = useState<OrderByParam>(
    orderParams ? orderParams[0] : OrderByDefaultParam,
  )
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(
    `${orderParams ? orderParams[0].field : OrderByDefaultParam.field}_${0}`,
  )
  const [hiddenParams, setHiddenParams] = useState<string[]>([])

  const handleOrderChange = useCallback(
    (newOrderBy: OrderByParam) => {
      if (newOrderBy.field !== orderBy?.field) {
        setOrderBy(newOrderBy)
        setKey(`${newOrderBy.field}_${renderCount}`)
      }
    },
    [orderBy.field, renderCount],
  )

  const handleFallbackOnEmptyResult = (orderBy: OrderByParam) => {
    if (orderBy.field !== 'embedding.score') {
      return
    }

    if (fallbackOrderParam) {
      setHiddenParams(prev =>
        prev.includes(orderBy.field) ? prev : [...prev, orderBy.field],
      )
      handleOrderChange(fallbackOrderParam)
    }
  }

  // @todo: abstract this away into context to be able to just get queryFilters pre formatted and reusable
  const { filters } = useContext(FeedSettingsContext)
  const router = useRouter()
  const pathname = router.pathname
  useEffect(() => {
    if (disableFilters) {
      return
    }

    let activeFilters = {}

    filters.map(filter => {
      Object.entries(filter).map(items => {
        let values: FilterName[] = []
        if (typeof items[1] === 'string') {
          if (items[0] === 'visibility') {
            if (!pathname.startsWith('/creators/[id]')) {
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

    setFeedFilters(activeFilters)
  }, [disableFilters, filters, pathname])

  useEffect(() => {
    setFetchStartDate(new Date().toISOString())
    setRenderCount(prevState => {
      setKey(`${orderBy.field}_${prevState + 1}`)
      return prevState + 1
    })
  }, [orderBy, feedFilters])

  if (!fetchStartDate) {
    return <LoadingIndicator />
  }

  return (
    <>
      {(orderParams && orderParams.length > 1) ||
      (!disableFilters && itemType && itemType === 'creation') ? (
        <div className="flex flex-wrap space-y-2 justify-between mb-4">
          {orderParams && orderParams.length > 1 ? (
            <OrderByButtons
              params={orderParams.filter(
                item => !hiddenParams.includes(item.field),
              )}
              initialParam={
                orderParams.filter(
                  item => !hiddenParams.includes(item.field),
                )[0]
              }
              onOrderChange={item => handleOrderChange(item)}
            />
          ) : null}

          {!disableFilters && itemType && itemType === 'creation' ? (
            <FeedFilter />
          ) : null}
        </div>
      ) : null}

      <MasonryInfinite
        key={key}
        orderBy={orderBy}
        itemType={itemType}
        query={{ ...query, ...feedFilters, maxDate: fetchStartDate }}
        emptyResultHandler={
          fallbackOrderParam ? handleFallbackOnEmptyResult : undefined
        }
      />
    </>
  )
}

export default MasonryInfiniteContainer
