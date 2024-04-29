'use client'

import { useWindowVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import CreationCard from '@/components/card/creation-card'
import CreationData, { CreationDataLandscape, CreationDataPortrait } from '@/stories/dummyData/creation'
import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import LoadingIndicator from '@/components/loading-indicator'
import { useElementSize } from '@/hooks/use-element-size'

async function fetchServerPage(
  limit: number,
  nextCursor: number = 0,
): Promise<{ rows: string[]; nextOffset: number }> {
  const rows = new Array(limit)
    .fill(0)
    .map(getRandomData)

  console.log('fetchServerPage', rows.length, nextCursor)

  await new Promise((r) => setTimeout(r, 250))

  return { rows, nextCursor: nextCursor + 1 }
}

const getRandomData = () => {
  // randomly return CreationData, CreationDataLandscape or CreationDataPortrait
  const randomIndex = Math.floor(Math.random() * 3)
  switch (randomIndex) {
    case 0:
      return CreationData
    case 1:
      return CreationDataLandscape
    case 2:
      return CreationDataPortrait
    default:
      return CreationData
  }
}

const MASONRY_COLUMN_COUNT = 4
const MASONRY_GUTTER = 16
const QUERY_LIMIT = 35

const MasonryVirtualizerVertical = () => {
  const { ref: masonryWrapRef, width: masonryWrapWidth } = useElementSize()

  const columnWidth = useMemo(() => {
    return (masonryWrapWidth - ((MASONRY_COLUMN_COUNT - 1) * MASONRY_GUTTER)) / MASONRY_COLUMN_COUNT
  }, [masonryWrapWidth])

  const {
    // status,
    data,
    // error,
    // isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['creations'],
    queryFn: (ctx) => fetchServerPage(QUERY_LIMIT, ctx.pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const allRows = useMemo(() => {
    return data?.pages?.flatMap((d) => d.rows) || []
  }, [data])

  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    estimateSize: () => 300,
    overscan: QUERY_LIMIT,
    lanes: MASONRY_COLUMN_COUNT,
    gap: MASONRY_GUTTER,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastItem = virtualItems[virtualItems.length - 1]
  const virtualItemsStringified = JSON.stringify(rowVirtualizer.getVirtualItems())

  useEffect(() => {
    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= allRows.length - 3 &&
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


  const renderItem = useCallback((virtualItem: VirtualItem) => {
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
          left: virtualItem.lane ? `${(columnWidth + MASONRY_GUTTER) * virtualItem.lane}px` : 0,
          width: `${columnWidth}px`,
          transform: `translateY(${virtualItem.start}px)`,
        }}
      >
        {isLoaderRow
          ? (
            <div className='flex items-center justify-center'>
              {hasNextPage
                ? (
                  <LoadingIndicator className='h-6 w-6' />
                )
                : 'Nothing more to load'
              }
            </div>
          )
          : (
            <CreationCard
              creation={item}
              creator={item.user}
              linkHref={`/creations/${item._id}`}
              showFooter={true}
            />
          )}
      </div>
    )
  }, [allRows, hasNextPage, rowVirtualizer, columnWidth])

  return (
    <div
      ref={masonryWrapRef}
      className='flex'
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => renderItem(virtualItem))}
      </div>
    </div>
  )
}

export default MasonryVirtualizerVertical