'use client'

import CreationCard from '@/components/card/creation-card'
import LoadingIndicator from '@/components/loading-indicator'
import { useElementSize } from '@/hooks/use-element-size'
import { useMediaQuery } from '@/hooks/use-media-query'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { FeedCreationsCursorResponse, TaskV2 } from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { VirtualItem, useWindowVirtualizer } from '@tanstack/react-virtual'
import React, { useCallback, useEffect, useMemo } from 'react'

const MASONRY_GUTTER = 16
const DEFAULT_PAGE_LIMIT = 35

type Props = {
  apiEndpoint: string
  render: ({ item }: { item: TaskV2 }) => React.JSX.Element
  query: { [key: string]: unknown }
  queryKey: unknown[]
  minCols?: number
  limit?: number
}

const MasonryVirtualizerVertical = ({
  apiEndpoint,
  render,
  query,
  queryKey,
  minCols = 1,
  limit = DEFAULT_PAGE_LIMIT,
}: Props) => {
  const { ref: masonryWrapRef, width: masonryWrapWidth } =
    useElementSize<HTMLDivElement>()

  const mediaQueries = [
    useMediaQuery('(min-width: 1920px)'),
    useMediaQuery('(min-width: 1536px)'),
    useMediaQuery('(min-width: 1280px)'),
    useMediaQuery('(min-width: 1024px)'),
    useMediaQuery('(min-width: 768px)'),
    useMediaQuery('(min-width: 640px)'),
    useMediaQuery('(min-width: 480px)'),
  ].reverse()

  const activeMQ = mediaQueries.lastIndexOf(true)
  const MASONRY_COLUMN_COUNT =
    activeMQ !== -1 ? minCols + (activeMQ + 1) : minCols

  const columnWidth = useMemo(() => {
    return (
      (masonryWrapWidth - (MASONRY_COLUMN_COUNT - 1) * MASONRY_GUTTER) /
      MASONRY_COLUMN_COUNT
    )
  }, [MASONRY_COLUMN_COUNT, masonryWrapWidth])

  const {
    status,
    data,
    error,
    // isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const paginationRoute = createCursorPaginationRoute(apiEndpoint, {
        // collectionId: featuredCollectionId,
        ...query,
        cursor: pageParam || '',
        limit: limit,
      })

      // console.log({paginationRoute})
      return fetcher(paginationRoute)
    },
    staleTime: 60,
    getNextPageParam: (lastPage: FeedCreationsCursorResponse) => {
      return lastPage.nextCursor ? lastPage.nextCursor : undefined
    },
    initialPageParam: undefined,
  })

  // console.log({queryKey, query})

  const allRows = useMemo(() => {
    return data?.pages?.flatMap(d => d.docs) || []
  }, [data])

  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    estimateSize: () => 156,
    overscan: limit,
    lanes: MASONRY_COLUMN_COUNT,
    gap: MASONRY_GUTTER,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]
  const virtualItemsStringified = JSON.stringify(
    rowVirtualizer.getVirtualItems(),
  )

  useEffect(() => {
    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= allRows.length - DEFAULT_PAGE_LIMIT &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    virtualItemsStringified,
    lastItem,
  ])

  const renderItem = useCallback(
    (virtualItem: VirtualItem) => {
      const item = allRows[virtualItem.index]
      const isLoaderRow = virtualItem.index > allRows.length - 1

      if (!item && !isLoaderRow) {
        return null
      }

      return (
        <div
          key={virtualItem.index}
          ref={rowVirtualizer.measureElement}
          data-index={virtualItem.index}
          style={{
            position: 'absolute',
            top: 0,
            left: virtualItem.lane
              ? `${(columnWidth + MASONRY_GUTTER) * virtualItem.lane}px`
              : 0,
            width: `${columnWidth}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {isLoaderRow ? (
            <div className="flex items-center justify-center">
              {hasNextPage ? (
                <LoadingIndicator className="h-6 w-6" />
              ) : (
                'Nothing more to load'
              )}
            </div>
          ) : item ? (
            <CreationCard
              creation={item}
              creator={item.user}
              linkHref={`/creations/${item._id}`}
              // showFooter={true}
            />
          ) : (
            <div>Missing data</div>
          )}
        </div>
      )
    },
    [render, allRows, hasNextPage, rowVirtualizer, columnWidth],
  )

  return (
    <div
      data-test-id="masonry-virtualizer-vertical"
      ref={masonryWrapRef}
      className="flex"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {!allRows.length ? (
          <div className="bg-primary/10 w-full h-full flex justify-center rounded-lg">
            {status === 'pending' ? (
              <LoadingIndicator />
            ) : (
              <div className="px-4">Nothing found.</div>
            )}
          </div>
        ) : null}

        {rowVirtualizer
          .getVirtualItems()
          .map(virtualItem => renderItem(virtualItem))}

        {error ? <div className="text-destructive">{error.message}</div> : null}
      </div>
    </div>
  )
}

export default MasonryVirtualizerVertical
