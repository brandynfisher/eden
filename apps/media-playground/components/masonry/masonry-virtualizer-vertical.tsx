'use client'

import { useWindowVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import CreationCard from '@/components/card/creation-card'
import CreationData, { CreationDataLandscape, CreationDataPortrait } from '@/stories/dummyData/creation'
import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import LoadingIndicator from '@/components/loading-indicator'
import { useElementSize } from '@/hooks/use-element-size'
import { Creation } from '@edenlabs/eden-sdk'
import { useMediaQuery } from '@/hooks/use-media-query'

async function fetchServerPage(
  limit: number,
  nextOffset: number = 0,
): Promise<{ rows: Creation[]; nextOffset: number }> {
  const rows = new Array(limit)
    .fill(0)
    .map(getRandomData)

  console.log('fetchServerPage', rows.length, nextOffset)

  await new Promise((r) => setTimeout(r, 250))

  return { rows, nextOffset: nextOffset + 1 }
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

const MASONRY_GUTTER = 16
const QUERY_LIMIT = 35

const MasonryVirtualizerVertical = () => {
  const { ref: masonryWrapRef, width: masonryWrapWidth } = useElementSize()
  const above480 = useMediaQuery('(min-width: 480px)')
  const above768 = useMediaQuery('(min-width: 768px)')
  const above1024 = useMediaQuery('(min-width: 1024px)')
  const above1280 = useMediaQuery('(min-width: 1280px)')
  const above1536 = useMediaQuery('(min-width: 1536px)')
  const above1920 = useMediaQuery('(min-width: 1920px)')

  const MASONRY_COLUMN_COUNT = above1920 ? 7 : above1536 ? 6 : above1280 ? 5 : above1024 ? 4 : above768 ? 3 : above480 ? 2 : 1

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
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0
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