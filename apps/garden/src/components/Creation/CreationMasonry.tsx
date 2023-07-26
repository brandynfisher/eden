import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, {
  OrderByDefaultParam,
  OrderByParam,
} from '@/components/OrderByButtons'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { useViewportSize } from '@mantine/hooks'
import { Button, Empty } from 'antd'
import { useInfiniteLoader } from 'masonic'
import {
  MasonryScroller,
  useContainerPosition,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import Link from 'next/link'
import React, { useContext, useRef, useState } from 'react'

type ObserverRect = {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
  x: number
  y: number
}

const CreationMasonry = ({
  query,
  hasSort,
  wrapperSizeRect,
}: {
  query?: PaginatedFeedQuery
  hasSort?: OrderByParam[]
  wrapperSizeRect?: ObserverRect
}) => {
  const containerRef = useRef(null)
  const [orderBy, setOrderBy] = useState<OrderByParam>(OrderByDefaultParam)
  const [key, setKey] = useState(0)

  const { isConnected, settings, address } = useContext(UserContext)
  const isConnectedUser =
    isConnected && query && query.userId && query.userId === address

  const {
    creations,
    maybeLoadMore: maybeLoadNextPage,
    setSize,
    isEmpty,
  } = useFeedPaginated(query, orderBy)

  const { width: windowWidth, height: windowHeight } = useViewportSize()

  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    wrapperSizeRect,
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
    [orderBy],
  )
  const resizeObserver = useResizeObserver(positioner)

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

  return (
    <>
      {hasSort && (
        <OrderByButtons
          params={hasSort}
          onOrderChange={item => handleOrderChange(item)}
        />
      )}

      {creations.length && typeof creations[0] === 'undefined' ? (
        <div>error fetching list</div>
      ) : (
        <MasonryScroller
          style={{ outline: 'none' }}
          key={key}
          positioner={positioner}
          resizeObserver={resizeObserver}
          containerRef={containerRef}
          items={creations}
          height={wrapperSizeRect?.height || windowHeight}
          offset={offset}
          overscanBy={3}
          itemHeightEstimate={300}
          render={CreationCard}
          onRender={maybeLoadMore}
          itemKey={data => data._id}
        />
      )}

      {isEmpty && !creations.length && (
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
                      className="flex items-center text-gray-400"
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
    </>
  )
}

export default CreationMasonry
