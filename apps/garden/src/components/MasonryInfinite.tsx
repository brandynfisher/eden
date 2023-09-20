'use client'

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/Layout/buttons/OrderByButtons'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { MasonryContext } from '@/providers/MasonryProvider'
import { UserContext } from '@/providers/UserProvider'
import { useViewportSize } from '@mantine/hooks'
import { useResizeObserver as useResizeObserverMantine } from '@mantine/hooks'
import { Button, Empty } from 'antd'
import { useInfiniteLoader } from 'masonic'
import {
  MasonryScroller,
  useContainerPosition,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import Link from 'next/link'
import React, { useContext, useEffect, useRef, useState } from 'react'

const MasonryInfinite = ({
  type,
  itemComponent,
  query,
  hasSort,
}: {
  type: 'creations' | 'concepts'
  itemComponent: typeof CreationCard | typeof ConceptCard
  query?: PaginatedFeedQuery
  hasSort?: OrderByParam[]
}) => {
  const { currentIndex, setCurrentItem, setTotalItems } =
    useContext(MasonryContext)
  const containerRef = useRef(null)
  const [key, setKey] = useState(0)

  const { isConnected, settings, address } = useContext(UserContext)
  const isConnectedUser =
    isConnected && query && query.userId && query.userId === address

  const [orderBy, setOrderBy] = useState<OrderByParam>(
    hasSort ? hasSort[0] : OrderByDefaultParam,
  )
  const {
    items,
    maybeLoadMore: maybeLoadNextPage,
    setSize,
    isEmpty,
    hasNextPage,
  } = useFeedPaginated(type, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      if (hasNextPage) {
        await maybeLoadNextPage()
      }
    },
    {
      isItemLoaded: (index, items) => {
        return !!items[index]
      },
      minimumBatchSize: 16,
      threshold: 16,
    },
  )

  const handleOrderChange = (newOrderBy: OrderByParam) => {
    if (newOrderBy.field !== orderBy?.field) {
      setOrderBy(newOrderBy)
      setSize(1)
      setKey(key + 1)
    }
  }

  const [ref, rect] = useResizeObserverMantine()
  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    rect,
  ])

  const positioner = usePositioner(
    {
      width,
      columnGutter: 16,
      rowGutter: windowWidth < 768 ? 0 : 8,
      columnCount:
        settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : undefined,
      maxColumnCount:
        windowWidth < 768
          ? 1
          : settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : windowWidth > 1920
          ? 6
          : windowWidth > 1440
          ? 5
          : settings?.maxGridCols.params.initialValue,
    },
    [orderBy, width, query?.userId],
  )
  const resizeObserver = useResizeObserver(positioner)

  useEffect(() => {
    setTotalItems(items.length)
  }, [items.length])

  useEffect(() => {
    if (currentIndex === null) return

    setCurrentItem(items[currentIndex])

    if (hasNextPage && currentIndex === items.length - 1) {
      console.log('reached last item, trigger maybeLoadMore')
      maybeLoadMore(currentIndex, currentIndex + 10, items)
    }
  }, [currentIndex, hasNextPage])

  return (
    <div ref={ref}>
      {hasSort && (
        <OrderByButtons
          params={hasSort}
          onOrderChange={item => handleOrderChange(item)}
        />
      )}

      {items.length && typeof items[0] === 'undefined' ? (
        <div>error fetching list</div>
      ) : (
        <>
          {items.length > 0 && (
            <MasonryScroller
              style={{ outline: 'none' }}
              key={key}
              positioner={positioner}
              resizeObserver={resizeObserver}
              containerRef={containerRef}
              items={items}
              height={windowHeight}
              offset={offset}
              overscanBy={3}
              itemHeightEstimate={300}
              render={itemComponent}
              onRender={maybeLoadMore}
              itemKey={(item, _index) => item?._id ?? _index}
            />
          )}
        </>
      )}

      {isEmpty && !items.length && (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>

                {isConnectedUser && (
                  <Link href="/create/creations">
                    <Button
                      type="dashed"
                      className="font-mono flex items-center text-gray-400"
                    >
                      <div>Create more</div>
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

export default MasonryInfinite
