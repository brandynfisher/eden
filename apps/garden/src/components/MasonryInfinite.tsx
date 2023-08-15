'use client'

import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/OrderByButtons'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { useResizeObserver as useResizeObserverMantine } from '@mantine/hooks'
import { Button, Empty } from 'antd'
import { RenderComponentProps, useInfiniteLoader } from 'masonic'
import {
  MasonryScroller,
  useContainerPosition,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import Link from 'next/link'
import React, { useContext, useRef, useState } from 'react'

const MasonryInfinite = ({
  type,
  itemComponent,
  query,
  hasSort,
}: {
  type: 'creations' | 'concepts'
  itemComponent: React.ComponentType<RenderComponentProps<Creation | Concept>>
  query?: PaginatedFeedQuery
  hasSort?: OrderByParam[]
}) => {
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
  } = useFeedPaginated(type, query, orderBy)

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      await maybeLoadNextPage()
    },
    {
      isItemLoaded: (index, items) => {
        return !!items[index]
      },
      minimumBatchSize: 10,
      threshold: 10,
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
      columnGutter: 12,
      columnCount:
        settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : undefined,
      maxColumnCount:
        settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : settings?.maxGridCols.params.initialValue,
    },
    [orderBy, width],
  )
  const resizeObserver = useResizeObserver(positioner)

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
          itemKey={data => data._id}
        />
      )}

      {isEmpty && !items.length && (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>

                {isConnectedUser && (
                  <Link href="/create">
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
