import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons, { OrderByParam } from '@/components/OrderByButtons'
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

const CreationMasonry = ({
  query,
  hasSort,
}: {
  query?: PaginatedFeedQuery
  hasSort: boolean
}) => {
  const containerRef = useRef(null)
  const [orderBy, setOrderBy] = useState<OrderByParam>()
  const [key, setKey] = useState(0)

  const { isConnected, settings, address } = useContext(UserContext)
  const isConnectedUser =
    isConnected && query && query.userId && query.userId === address

  const {
    creations,
    maybeLoadMore: maybeLoadNextPage,
    isEmpty,
    setSize,
  } = useFeedPaginated(query, orderBy)

  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
  ])

  const positioner = usePositioner(
    {
      width,
      columnGutter: 12,
      columnCount: settings?.maxGridCols.value || undefined,
      maxColumnCount: settings?.maxGridCols.value || 4,
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

  return (
    <>
      {!isEmpty ? (
        <>
          {creations && !creations.length && <div>has Elements</div>}
          {hasSort && (
            <OrderByButtons onOrderChange={item => handleOrderChange(item)} />
          )}
          <MasonryScroller
            key={key}
            positioner={positioner}
            resizeObserver={resizeObserver}
            containerRef={containerRef}
            items={creations}
            height={windowHeight}
            offset={offset}
            overscanBy={4}
            itemHeightEstimate={400}
            render={CreationCard}
            onRender={maybeLoadMore}
          />
        </>
      ) : (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing created yet.</div>

                {isConnectedUser && (
                  <Link href="/create">
                    <Button
                      type="dashed"
                      className="flex items-center text-gray-400"
                    >
                      <div>Begin here</div>
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
