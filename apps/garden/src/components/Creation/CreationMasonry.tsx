import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import OrderByButtons from '@/components/OrderByButtons'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { Button, Empty } from 'antd'
import { Masonry, useInfiniteLoader } from 'masonic'
import Link from 'next/link'
import React, { useContext } from 'react'

const CreationMasonry = ({ query }: { query?: PaginatedFeedQuery }) => {
  const { isConnected, settings, address } = useContext(UserContext)
  const {
    creations,
    maybeLoadMore: maybeLoadNextPage,
    isEmpty,
  } = useFeedPaginated(query)
  const isConnectedUser =
    isConnected && query && query.userId && query.userId === address

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      await maybeLoadNextPage()
    },
    {
      isItemLoaded: (index, items) => !!items[index],
      minimumBatchSize: 12,
      threshold: 4,
    },
  )

  return (
    <>
      {isEmpty ? (
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
      ) : (
        <>
          <OrderByButtons />
          <Masonry
            items={creations}
            columnCount={settings?.maxGridCols.value || undefined}
            maxColumnCount={settings?.maxGridCols.value || 4}
            columnGutter={12}
            overscanBy={1.75}
            render={CreationCard}
            onRender={maybeLoadMore}
            itemHeightEstimate={500}
          />
        </>
      )}
    </>
  )
}

export default CreationMasonry
