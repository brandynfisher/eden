'use client'

import { useWindowVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import CreationCard from '@/components/card/creation-card'
// import CreationData, { CreationDataLandscape, CreationDataPortrait } from '@/stories/dummyData/creation'
import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import LoadingIndicator from '@/components/loading-indicator'
import { useElementSize } from '@/hooks/use-element-size'
import { FeedCreationsCursorResponse, transformArgsIntoURLParams } from '@edenlabs/eden-sdk'
import { useMediaQuery } from '@/hooks/use-media-query'
import { fetcher } from '@/lib/fetcher'
import { FeedQueryParams } from '@/types/Feed'

// async function fetchDummyData(
//   limit: number,
//   nextOffset: number = 0
// ): Promise<Creation[]> {
//   const rows = new Array(limit)
//     .fill(0)
//     .map(getRandomData)
//
//   console.log('fetchDummyData', rows.length, nextOffset)
//
//   await new Promise((r) => setTimeout(r, 250))
//
//   return rows
// }

// async function fetchApiData(
//   nextOffset: number = 0
// ): Promise<Creation[]> {
//   const url = createCursorPaginationUrl(`/api/feed/creations`, { limit: 35, sort: 'createdAt;-1' })
//   const rows = await fetcher(url)
//
//
//   return rows
// }
//
//
// async function fetchServerPage(
//   limit: number,
//   nextOffset: number = 0,
// ): Promise<{ rows: Creation[]; nextOffset: number }> {
//   // const data = await fetchDummyData(limit, nextOffset)
//   const data = await fetchApiData(nextOffset)
//
//   return { rows: data, nextOffset: nextOffset + 1 }
// }

// const getRandomData = () => {
//   // randomly return CreationData, CreationDataLandscape or CreationDataPortrait
//   const randomIndex = Math.floor(Math.random() * 3)
//   switch (randomIndex) {
//     case 0:
//       return CreationData
//     case 1:
//       return CreationDataLandscape
//     case 2:
//       return CreationDataPortrait
//     default:
//       return CreationData
//   }
// }

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
  }, [MASONRY_COLUMN_COUNT, masonryWrapWidth])

  // @todo: pass this in as props
  const query: FeedQueryParams = {
    limit: 35,
    sort: ['createdAt;-1']
  }

  // @todo: generate key from relevant filter / query params
  const queryKey = [
    'feed',
    'creations',
    query
  ]

  const {
    // status,
    data,
    // error,
    // isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: ({pageParam}) => {
      // console.log(pageParam)
      const queryUrl = `/api/feed/creations?${transformArgsIntoURLParams(pageParam ? { ...query, cursor: pageParam } : query)}`
      // console.log(queryUrl)
      return fetcher(queryUrl)
    },
    staleTime: 1000000000,
    getNextPageParam: (lastPage: FeedCreationsCursorResponse) => {
      // console.log('nextPageParam', lastPage.nextCursor)
      return lastPage.nextCursor
    },
    initialPageParam: undefined
  })

  // console.log({queryKey, query})

  const allRows = useMemo(() => {
    return data?.pages?.flatMap((d) => d.docs) || []
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
      lastItem.index >= allRows.length - (QUERY_LIMIT) &&
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
            item ?(
              <CreationCard
                creation={item}
                creator={item.user}
                linkHref={`/creations/${item._id}`}
                showFooter={true}
              />
            ) : (
              <div>Missing data</div>
            )
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